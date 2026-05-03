"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface AlertFormProps {
  defaultDoctorId?: string;
  defaultDoctorName?: string;
  specialties: { id: string; name: string }[];
}

const clinicOptions = [
  { id: "indisa" as const, name: "Indisa" },
  { id: "clc" as const, name: "CLC" },
  { id: "santa_maria" as const, name: "Santa María" },
  { id: "alemana" as const, name: "Alemana" },
];

const dayOptions = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function AlertForm({
  defaultDoctorId,
  defaultDoctorName,
  specialties,
}: AlertFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    doctorNameQuery: defaultDoctorName || "",
    doctorId: defaultDoctorId || "",
    specialtyId: "",
    clinicIds: [] as ("indisa" | "clc" | "santa_maria" | "alemana")[],
    dateFrom: "",
    dateTo: "",
    timeFrom: "08:00",
    timeTo: "18:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    includeTelemedicine: true,
    channel: "email" as "email" | "push" | "webhook",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("alerts").insert({
        user_id: user.id,
        doctor_id: form.doctorId || null,
        doctor_name_query: form.doctorNameQuery || null,
        specialty_id: form.specialtyId || null,
        clinic_ids: form.clinicIds,
        date_from: form.dateFrom || null,
        date_to: form.dateTo || null,
        time_from: form.timeFrom || null,
        time_to: form.timeTo || null,
        days_of_week: form.daysOfWeek,
        include_telemedicine: form.includeTelemedicine,
        channel: form.channel,
      });

      if (error) throw error;

      toast.success("Alerta creada exitosamente");
      router.push("/alerts");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear la alerta"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const toggleClinic = (id: "indisa" | "clc" | "santa_maria" | "alemana") => {
    setForm((prev) => ({
      ...prev,
      clinicIds: prev.clinicIds.includes(id)
        ? prev.clinicIds.filter((c) => c !== id)
        : [...prev.clinicIds, id],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Nombre del médico
        </label>
        <input
          type="text"
          value={form.doctorNameQuery}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, doctorNameQuery: e.target.value }))
          }
          placeholder="Ej: Dr. García"
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Dejar vacío para buscar en cualquier médico
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Especialidad
        </label>
        <select
          value={form.specialtyId}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, specialtyId: e.target.value }))
          }
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Cualquier especialidad</option>
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
          {clinicOptions.map((clinic) => (
            <label
              key={clinic.id}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                form.clinicIds.includes(clinic.id)
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
              }`}
            >
              <input
                type="checkbox"
                checked={form.clinicIds.includes(clinic.id)}
                onChange={() => toggleClinic(clinic.id)}
                className="sr-only"
              />
              <span className="text-sm">{clinic.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Dejar vacío para buscar en todas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Desde fecha
          </label>
          <input
            type="date"
            value={form.dateFrom}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Hasta fecha
          </label>
          <input
            type="date"
            value={form.dateTo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dateTo: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Hora desde
          </label>
          <input
            type="time"
            value={form.timeFrom}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, timeFrom: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Hora hasta
          </label>
          <input
            type="time"
            value={form.timeTo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, timeTo: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Días de la semana
        </label>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                form.daysOfWeek.includes(day.value)
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.includeTelemedicine}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                includeTelemedicine: e.target.checked,
              }))
            }
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
        </label>
        <span className="text-sm text-neutral-700">
          Incluir telemedicina
        </span>
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        Crear alerta
      </Button>
    </form>
  );
}
