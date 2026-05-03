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

    const { clinicId } = await req.json();

    if (!clinicId) {
      return new Response(JSON.stringify({ error: "clinicId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: run } = await supabase
      .from("scrape_runs")
      .insert({ clinic_id: clinicId, status: "running" })
      .select()
      .single();

    const startTime = Date.now();

    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, external_id")
      .eq("clinic_id", clinicId)
      .limit(100);

    const durationMs = Date.now() - startTime;

    await supabase
      .from("scrape_runs")
      .update({
        status: "success",
        slots_found: doctors?.length || 0,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run?.id);

    return new Response(
      JSON.stringify({
        success: true,
        runId: run?.id,
        doctorsFound: doctors?.length || 0,
        durationMs,
      }),
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
