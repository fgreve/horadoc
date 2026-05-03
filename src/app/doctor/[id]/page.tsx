import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClinicLogo } from "@/components/shared/ClinicLogo";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Clock, MapPin, Bell, ExternalLink } from "lucide-react";

interface DoctorPageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from("doctors")
    .select(`
      id,
      name,
      clinic_id,
      specialty_raw,
      sede,
      consultation_price,
      specialty:specialties(name),
      clinic:clinics(name, booking_url)
    `)
    .eq("id", id)
    .single();

  if (!doctor) {
    notFound();
  }

  const { data: slots } = await supabase
    .from("available_slots")
    .select("id, date, start_time, end_time, is_telemedicine, sede")
    .eq("doctor_id", id)
    .eq("is_available", true)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(100);

  const slotsByDate: Record<string, typeof slots> = {};
  if (slots) {
    for (const slot of slots) {
      const date = slot.date;
      if (!slotsByDate[date]) {
        slotsByDate[date] = [];
      }
      slotsByDate[date]!.push(slot);
    }
  }

  const specialtyName =
    (doctor.specialty as { name: string } | null)?.name || doctor.specialty_raw;
  const clinicData = doctor.clinic as { name: string; booking_url: string } | null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Header user={null} />

      <main className="flex-1">
        <div className="border-b border-[#e7e5e4] bg-white py-8">
          <div className="mx-auto max-w-4xl px-4">
            <div className="flex items-start gap-4">
              <ClinicLogo
                clinicId={doctor.clinic_id as "indisa" | "clc" | "santa_maria" | "alemana"}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#1c1917] md:text-3xl">
                  {doctor.name}
                </h1>
                {specialtyName && (
                  <p className="mt-1 text-lg text-[#57534e]">{specialtyName}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {clinicData && (
                    <Badge variant="info" size="md">
                      {clinicData.name}
                    </Badge>
                  )}
                  {doctor.sede && (
                    <span className="flex items-center gap-1 text-sm text-[#57534e]">
                      <MapPin className="h-4 w-4" />
                      {doctor.sede}
                    </span>
                  )}
                  {doctor.consultation_price && (
                    <span className="text-sm font-medium text-[#292524]">
                      ${doctor.consultation_price.toLocaleString("es-CL")} CLP
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <h2 className="text-xl font-semibold text-[#1c1917]">
              Horas disponibles
            </h2>
            <Link
              href={`/alerts/new?doctor_id=${doctor.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#14b8a6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d9488]"
            >
              <Bell className="h-4 w-4" />
              Crear alerta para este medico
            </Link>
          </div>

          {Object.keys(slotsByDate).length > 0 ? (
            <div className="mt-6 space-y-6">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div
                  key={date}
                  className="rounded-xl border border-[#e7e5e4] bg-white p-5"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-[#292524]">
                    <Calendar className="h-4 w-4 text-[#14b8a6]" />
                    {new Date(date + "T12:00:00").toLocaleDateString("es-CL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dateSlots!.map((slot) => (
                      <a
                        key={slot.id}
                        href={clinicData?.booking_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-3 py-2 text-sm font-medium text-[#0f766e] transition-colors hover:bg-[#ccfbf1]"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {slot.start_time.slice(0, 5)}
                        {slot.is_telemedicine && (
                          <span className="ml-1 text-xs text-[#57534e]">TM</span>
                        )}
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-xl border border-[#e7e5e4] bg-white py-16 text-center">
              <Calendar className="h-12 w-12 text-[#d6d3d1]" />
              <p className="mt-4 text-lg font-medium text-[#292524]">
                Sin horas disponibles
              </p>
              <p className="mt-1 text-sm text-[#57534e]">
                Crea una alerta y te notificaremos cuando se libere una hora.
              </p>
              <Link
                href={`/alerts/new?doctor_id=${doctor.id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#14b8a6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d9488]"
              >
                <Bell className="h-4 w-4" />
                Crear alerta
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
