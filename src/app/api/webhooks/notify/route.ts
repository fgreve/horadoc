import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAlertEmail } from "@/lib/notifications/email";
import { sendWebhookNotification } from "@/lib/notifications/webhook";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slotId, alertId, userId } = body as {
    slotId: string;
    alertId: string;
    userId: string;
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: slot }, { data: alert }, { data: profile }] = await Promise.all([
    supabase
      .from("available_slots")
      .select("*, doctors(name, clinic_id, clinics(name, booking_url))")
      .eq("id", slotId)
      .single(),
    supabase.from("alerts").select("channel").eq("id", alertId).single(),
    supabase
      .from("profiles")
      .select("notification_email, webhook_url")
      .eq("id", userId)
      .single(),
  ]);

  if (!slot || !alert || !profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doctor = slot.doctors as unknown as {
    name: string;
    clinics: { name: string; booking_url: string };
  };

  const payload = {
    doctorName: doctor.name,
    clinicName: doctor.clinics.name,
    date: slot.date,
    time: slot.start_time,
    sede: slot.sede || undefined,
    bookingUrl: doctor.clinics.booking_url,
  };

  let delivered = false;

  if (alert.channel === "email" && profile.notification_email) {
    delivered = await sendAlertEmail({
      to: profile.notification_email,
      subject: `Nueva hora disponible: ${doctor.name}`,
      ...payload,
    });
  } else if (alert.channel === "webhook" && profile.webhook_url) {
    delivered = await sendWebhookNotification(profile.webhook_url, {
      alertId,
      ...payload,
    });
  }

  await supabase.from("notifications").insert({
    alert_id: alertId,
    user_id: userId,
    slot_id: slotId,
    channel: alert.channel,
    payload,
    delivered,
  });

  return NextResponse.json({ delivered });
}
