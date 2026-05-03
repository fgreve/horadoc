import { Search, Bell, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchHero } from "@/components/search/SearchHero";

const features = [
  {
    icon: Search,
    title: "Busqueda en tiempo real",
    description:
      "Monitoreamos la disponibilidad de horas en las principales clinicas de Santiago cada 30 minutos.",
  },
  {
    icon: Bell,
    title: "Alertas personalizadas",
    description:
      "Configura alertas por medico, especialidad, clinica o rango horario y recibe un email al instante.",
  },
  {
    icon: Building2,
    title: "Multiples clinicas",
    description:
      "Busca en Indisa, CLC, Santa Maria y Alemana desde un solo lugar, sin visitar cada portal.",
  },
];

const clinics = [
  { id: "indisa", name: "Indisa", letters: "IN", bg: "bg-[#1e40af]" },
  { id: "clc", name: "Clinica Las Condes", letters: "CLC", bg: "bg-[#7c3aed]" },
  { id: "santa_maria", name: "Santa Maria", letters: "SM", bg: "bg-[#0d9488]" },
  { id: "alemana", name: "Alemana", letters: "CA", bg: "bg-[#dc2626]" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-[#0d9488] via-[#14b8a6] to-[#5eead4] py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Encuentra horas medicas disponibles
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
              Monitorea disponibilidad en las principales clinicas de Santiago y
              recibe alertas cuando se libere una hora.
            </p>
            <div className="mt-10">
              <SearchHero />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold text-[#1c1917] md:text-3xl">
              Como funciona
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[#e7e5e4] bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ccfbf1]">
                    <feature.icon className="h-6 w-6 text-[#0d9488]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#1c1917]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[#57534e]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#e7e5e4] bg-[#fafaf9] py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-xl font-semibold text-[#57534e]">
              Clinicas disponibles
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white ${clinic.bg}`}
                  >
                    {clinic.letters}
                  </div>
                  <span className="text-sm font-medium text-[#292524]">
                    {clinic.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
