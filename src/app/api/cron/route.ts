import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CLCScraper } from "@/lib/scrapers/clc";
import { AlemanaScraper } from "@/lib/scrapers/alemana";
import { SantaMariaScraper } from "@/lib/scrapers/santa-maria";
import { IndisaScraper } from "@/lib/scrapers/indisa";
import type { ClinicId, ClinicScraper, RawSlot } from "@/lib/scrapers/base";
import { sendAlertEmail } from "@/lib/notifications/email";
import { sendWebhookNotification } from "@/lib/notifications/webhook";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const scrapers: Record<ClinicId, ClinicScraper> = {
  clc: new CLCScraper(),
  alemana: new AlemanaScraper(),
  santa_maria: new SantaMariaScraper(),
  indisa: new IndisaScraper(),
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicIds: ClinicId[] = ["clc", "alemana", "santa_maria", "indisa"];
  const results = [];

  for (const clinicId of clinicIds) {
    const startTime = Date.now();
    const { data: run } = await supabase
      .from("scrape_runs")
      .insert({ clinic_id: clinicId, status: "running" })
      .select()
      .single();

    try {
      const scraper = scrapers[clinicId];
      const dateRange = {
        from: new Date(),
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };

      const { data: monitoredDoctors } = await supabase
        .from("doctors")
        .select("id, external_id")
        .eq("clinic_id", clinicId);

      if (!monitoredDoctors?.length) {
        const specialties = await scraper.scrapeSpecialties();
        const doctors = [];
        for (const spec of specialties.slice(0, 5)) {
          const specDoctors = await scraper.scrapeDoctors(spec.externalId);
          doctors.push(...specDoctors);
        }

        for (const doc of doctors) {
          await supabase.from("doctors").upsert(
            {
              clinic_id: clinicId,
              external_id: doc.externalId,
              name: doc.name,
              specialty_raw: doc.specialtyRaw,
              sede: doc.sede,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "clinic_id,external_id" }
          );
        }
      }

      const { data: doctorsToScrape } = await supabase
        .from("doctors")
        .select("id, external_id")
        .eq("clinic_id", clinicId)
        .limit(20);

      let slotsFound = 0;
      let slotsNew = 0;

      for (const doctor of doctorsToScrape ?? []) {
        const rawSlots: RawSlot[] = await scraper.scrapeSlots(
          doctor.external_id!,
          dateRange
        );
        slotsFound += rawSlots.length;

        for (const slot of rawSlots) {
          const { data: upserted } = await supabase
            .from("available_slots")
            .upsert(
              {
                doctor_id: doctor.id,
                clinic_id: clinicId,
                date: slot.date,
                start_time: slot.startTime,
                end_time: slot.endTime || null,
                sede: slot.sede || null,
                is_telemedicine: slot.isTelemedicine || false,
                raw_data: slot.rawData || {},
                last_seen_at: new Date().toISOString(),
                is_available: true,
              },
              { onConflict: "doctor_id,date,start_time" }
            )
            .select("id, first_seen_at, last_seen_at")
            .single();

          if (upserted && upserted.first_seen_at === upserted.last_seen_at) {
            slotsNew++;
            await processAlertMatches(upserted.id);
          }
        }
      }

      const { data: staleSlots } = await supabase
        .from("available_slots")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("is_available", true)
        .lt("last_seen_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const slotsRemoved = staleSlots?.length ?? 0;
      if (slotsRemoved > 0) {
        await supabase
          .from("available_slots")
          .update({ is_available: false })
          .eq("clinic_id", clinicId)
          .eq("is_available", true)
          .lt("last_seen_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
      }

      const durationMs = Date.now() - startTime;
      await supabase
        .from("scrape_runs")
        .update({
          status: "success",
          slots_found: slotsFound,
          slots_new: slotsNew,
          slots_removed: slotsRemoved,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run?.id);

      results.push({ clinicId, status: "success", slotsFound, slotsNew, slotsRemoved, durationMs });
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
      .select("channel, times_triggered")
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
        times_triggered: (alert?.times_triggered ?? 0) + 1,
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", match.alert_id);
  }
}
