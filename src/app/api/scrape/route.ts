import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clinicId, doctorIds } = body as {
    clinicId: string;
    doctorIds?: string[];
  };

  if (!clinicId) {
    return NextResponse.json(
      { error: "clinicId is required" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: run } = await supabase
    .from("scrape_runs")
    .insert({ clinic_id: clinicId, status: "running" })
    .select()
    .single();

  try {
    let query = supabase
      .from("doctors")
      .select("id, external_id, name")
      .eq("clinic_id", clinicId);

    if (doctorIds?.length) {
      query = query.in("id", doctorIds);
    }

    const { data: doctors } = await query;

    await supabase
      .from("scrape_runs")
      .update({
        status: "success",
        slots_found: doctors?.length || 0,
        duration_ms: Date.now() - new Date(run?.started_at || "").getTime(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", run?.id);

    return NextResponse.json({
      success: true,
      runId: run?.id,
      doctorsProcessed: doctors?.length || 0,
    });
  } catch (error) {
    await supabase
      .from("scrape_runs")
      .update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown",
        completed_at: new Date().toISOString(),
      })
      .eq("id", run?.id);

    return NextResponse.json(
      { error: "Scrape failed", details: String(error) },
      { status: 500 }
    );
  }
}
