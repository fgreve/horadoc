import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ClinicId } from "@/lib/scrapers/base";
import { sendAlertEmail } from "@/lib/notifications/email";
import { sendWebhookNotification } from "@/lib/notifications/webhook";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinics: ClinicId[] = ["indisa", "clc", "santa_maria", "alemana"];
  const results = [];

  for (const clinicId of clinics) {
    const startTime = Date.now();
    const { data: run } = await supabase
      .from("scrape_runs")
      .insert({ clinic_id: clinicId, status: "running" })
      .select()
      .single();

    try {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, external_id")
        .eq("clinic_id", clinicId);

      const monitoredDoctorIds = new Set<string>();
      const { data: activeAlerts } = await supabase
        .from("alerts")
        .select("doctor_id, clinic_ids")
        .eq("status", "active");

      activeAlerts?.forEach((alert) => {
        if (alert.doctor_id) monitoredDoctorIds.add(alert.doctor_id);
        if (
          !alert.clinic_ids?.length ||
          alert.clinic_ids.includes(clinicId)
        ) {
          doctors?.forEach((d) => monitoredDoctorIds.add(d.id));
        }
      });

      let slotsNew = 0;

      for (const doctorId of monitoredDoctorIds) {
        const { data: newSlots } = await supabase
          .from("available_slots")
          .select("id")
          .eq("doctor_id", doctorId)
          .eq("is_available", true)
          .gte("date", new Date().toISOString().split("T")[0])
          .gte("first_seen_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());

        if (newSlots?.length) {
          slotsNew += newSlots.length;
          for (const slot of newSlots) {
            await processAlertMatches(slot.id);
          }
        }
      }

      const durationMs = Date.now() - startTime;
      await supabase
        .from("scrape_runs")
        .update({
          status: "success",
          slots_new: slotsNew,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run?.id);

      results.push({ clinicId, status: "success", slotsNew, durationMs });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      await supabase
        .from("scrape_runs")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run?.id);

      results.push({ clinicId, status: "error", error: String(error) });
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}

async function processAlertMatches(slotId: string) {
  const { data: matches } = await supabase.rpc("match_alerts_for_slot", {
    slot_id: slotId,
  });

  if (!matches?.length) return;

  const { data: slot } = await supabase
    .from("available_slots")
    .select("*, doctors(name, clinic_id, clinics(name, booking_url))")
    .eq("id", slotId)
    .single();

  if (!slot) return;

  for (const match of matches) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_email, webhook_url")
      .eq("id", match.user_id)
      .single();

    if (!profile) continue;

    const { data: alert } = await supabase
      .from("alerts")
      .select("channel")
      .eq("id", match.alert_id)
      .single();

    const doctor = slot.doctors as unknown as {
      name: string;
      clinic_id: string;
      clinics: { name: string; booking_url: string };
    };

    const notificationPayload = {
      doctorName: doctor.name,
      clinicName: doctor.clinics.name,
      date: slot.date,
      time: slot.start_time,
      sede: slot.sede || undefined,
      bookingUrl: doctor.clinics.booking_url,
    };

    let delivered = false;

    if (alert?.channel === "email" && profile.notification_email) {
      delivered = await sendAlertEmail({
        to: profile.notification_email,
        subject: `Nueva hora disponible: ${doctor.name}`,
        ...notificationPayload,
      });
    } else if (alert?.channel === "webhook" && profile.webhook_url) {
      delivered = await sendWebhookNotification(profile.webhook_url, {
        alertId: match.alert_id,
        ...notificationPayload,
      });
    }

    await supabase.from("notifications").insert({
      alert_id: match.alert_id,
      user_id: match.user_id,
      slot_id: slotId,
      channel: alert?.channel || "email",
      payload: notificationPayload,
      delivered,
    });

    await supabase
      .from("alerts")
      .update({
        times_triggered: supabase.rpc as unknown as number,
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", match.alert_id);

    await supabase.rpc("", {});
    await supabase
      .from("alerts")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", match.alert_id);
  }
}
