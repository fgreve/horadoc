import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DoctorCard } from "@/components/search/DoctorCard";
import { Search } from "lucide-react";
import Link from "next/link";

const clinicOptions = [
  { id: "indisa", label: "Indisa" },
  { id: "clc", label: "CLC" },
  { id: "santa_maria", label: "Santa Maria" },
  { id: "alemana", label: "Alemana" },
] as const;

interface SearchPageProps {
  searchParams: Promise<{ q?: string; clinic?: string; specialty?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const clinicFilter = params.clinic || null;
  const specialtyFilter = params.specialty || null;

  const supabase = await createClient();

  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name, slug")
    .order("name");

  const selectedSpecialty = specialtyFilter
    ? specialties?.find((s) => s.slug === specialtyFilter)
    : null;

  const { data: doctors } = await supabase.rpc("search_doctors", {
    search_query: query || null,
    filter_clinic: clinicFilter as "indisa" | "clc" | "santa_maria" | "alemana" | null,
    filter_specialty: selectedSpecialty?.id || null,
    result_limit: 50,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Header user={null} />

      <main className="flex-1">
        <div className="border-b border-[#e7e5e4] bg-white py-6">
          <div className="mx-auto max-w-6xl px-4">
            <form action="/search" method="GET">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#57534e]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar medico, especialidad o clinica..."
                  className="w-full rounded-xl border border-[#e7e5e4] bg-white py-3 pl-12 pr-4 text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-64">
              <div className="rounded-xl border border-[#e7e5e4] bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#57534e]">
                  Clinica
                </h3>
                <div className="mt-3 space-y-2">
                  {clinicOptions.map((clinic) => (
                    <label
                      key={clinic.id}
                      className="flex items-center gap-2 text-sm text-[#292524]"
                    >
                      <input
                        type="checkbox"
                        checked={clinicFilter === clinic.id}
                        readOnly
                        className="rounded border-[#e7e5e4] text-[#14b8a6] focus:ring-[#14b8a6]"
                      />
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}${clinicFilter === clinic.id ? "" : `&clinic=${clinic.id}`}${specialtyFilter ? `&specialty=${specialtyFilter}` : ""}`}
                        className="hover:text-[#0d9488]"
                      >
                        {clinic.label}
                      </Link>
                    </label>
                  ))}
                </div>

                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#57534e]">
                  Especialidad
                </h3>
                <div className="mt-3">
                  <select
                    defaultValue={specialtyFilter || ""}
                    className="w-full rounded-lg border border-[#e7e5e4] bg-white px-3 py-2 text-sm text-[#292524] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  >
                    <option value="">Todas</option>
                    {specialties?.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              {query || clinicFilter || specialtyFilter ? (
                <p className="mb-4 text-sm text-[#57534e]">
                  {doctors?.length || 0} resultado{doctors?.length !== 1 ? "s" : ""}
                  {query ? ` para "${query}"` : ""}
                </p>
              ) : null}

              {doctors && doctors.length > 0 ? (
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={{
                        id: doctor.id!,
                        name: doctor.name!,
                        clinic_id: doctor.clinic_id!,
                        clinic_name: doctor.clinic_name!,
                        specialty: doctor.specialty || null,
                        sede: doctor.sede || null,
                        next_available_date: doctor.next_available_date || null,
                        available_slots_count: doctor.available_slots_count || 0,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#e7e5e4] bg-white py-16 text-center">
                  <Search className="h-12 w-12 text-[#d6d3d1]" />
                  <p className="mt-4 text-lg font-medium text-[#292524]">
                    Sin resultados
                  </p>
                  <p className="mt-1 text-sm text-[#57534e]">
                    Intenta con otro termino de busqueda o ajusta los filtros.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
