import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { slotId } = await req.json();

    if (!slotId) {
      return new Response(JSON.stringify({ error: "slotId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: matches } = await supabase.rpc("match_alerts_for_slot", {
      slot_id: slotId,
    });

    if (!matches?.length) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: slot } = await supabase
      .from("available_slots")
      .select("*, doctors(name, clinic_id, clinics(name, booking_url))")
      .eq("id", slotId)
      .single();

    let notified = 0;

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

      const doctor = slot.doctors as { name: string; clinics: { name: string; booking_url: string } };

      await supabase.from("notifications").insert({
        alert_id: match.alert_id,
        user_id: match.user_id,
        slot_id: slotId,
        channel: alert?.channel || "email",
        payload: {
          doctorName: doctor.name,
          clinicName: doctor.clinics.name,
          date: slot.date,
          time: slot.start_time,
          sede: slot.sede,
          bookingUrl: doctor.clinics.booking_url,
        },
        delivered: true,
      });

      await supabase
        .from("alerts")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", match.alert_id);

      notified++;
    }

    return new Response(
      JSON.stringify({ processed: matches.length, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
