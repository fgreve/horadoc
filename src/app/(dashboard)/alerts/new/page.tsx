"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const clinics = [
  { id: "indisa" as const, label: "Indisa" },
  { id: "clc" as const, label: "CLC" },
  { id: "santa_maria" as const, label: "Santa María" },
  { id: "alemana" as const, label: "Alemana" },
];

const daysOfWeek = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export default function NewAlertPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [specialties, setSpecialties] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const [doctorNameQuery, setDoctorNameQuery] = useState("");
  const [doctorId, setDoctorId] = useState<string | null>(
    searchParams.get("doctor_id")
  );
  const [specialtyId, setSpecialtyId] = useState("");
  const [selectedClinics, setSelectedClinics] = useState<("indisa" | "clc" | "santa_maria" | "alemana")[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("08:00");
  const [timeTo, setTimeTo] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [includeTelemedicine, setIncludeTelemedicine] = useState(true);

  useEffect(() => {
    async function fetchSpecialties() {
      const { data } = await supabase
        .from("specialties")
        .select("id, name")
        .order("name");
      if (data) setSpecialties(data);
    }
    fetchSpecialties();
  }, []);

  type ClinicId = "indisa" | "clc" | "santa_maria" | "alemana";
  function toggleClinic(id: ClinicId) {
    setSelectedClinics((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleDay(value: number) {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Debes iniciar sesión");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("alerts").insert({
      user_id: user.id,
      doctor_id: doctorId || null,
      doctor_name_query: doctorNameQuery || null,
      specialty_id: specialtyId || null,
      clinic_ids: selectedClinics,
      date_from: dateFrom || null,
      date_to: dateTo || null,
      time_from: timeFrom || null,
      time_to: timeTo || null,
      days_of_week: selectedDays,
      include_telemedicine: includeTelemedicine,
      channel: "email",
      status: "active",
    });

    setLoading(false);

    if (error) {
      toast.error("Error al crear la alerta");
      return;
    }

    toast.success("Alerta creada exitosamente");
    router.push("/alerts");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/alerts"
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nueva alerta</h1>
          <p className="text-neutral-600 mt-0.5">
            Configura los criterios para recibir notificaciones
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Criterios de búsqueda
          </h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nombre del médico
            </label>
            <input
              type="text"
              value={doctorNameQuery}
              onChange={(e) => setDoctorNameQuery(e.target.value)}
              placeholder="Ej: Dr. González, Dra. Muñoz..."
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {doctorId && (
              <p className="text-xs text-primary-600 mt-1">
                Médico preseleccionado (ID: {doctorId})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Especialidad
            </label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Clínicas
            </label>
            <div className="flex flex-wrap gap-2">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => toggleClinic(clinic.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedClinics.includes(clinic.id)
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  {clinic.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-neutral-800">Filtros</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Fecha desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Fecha hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Hora desde
              </label>
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Hora hasta
              </label>
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Días de la semana
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                    selectedDays.includes(day.value)
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700">
              Incluir telemedicina
            </label>
            <button
              type="button"
              onClick={() => setIncludeTelemedicine(!includeTelemedicine)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeTelemedicine ? "bg-primary-500" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includeTelemedicine ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-neutral-800">
            Notificación
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
              <svg
                className="w-4 h-4 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium text-primary-700">
                Email
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              Canal por defecto del MVP
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creando..." : "Crear alerta"}
        </button>
      </form>
    </div>
  );
}
