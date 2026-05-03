"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ClinicLogo } from "@/components/shared/ClinicLogo";

const clinics = [
  { id: "indisa", name: "Indisa" },
  { id: "clc", name: "CLC" },
  { id: "santa_maria", name: "Santa María" },
  { id: "alemana", name: "Alemana" },
] as const;

interface SearchFiltersProps {
  specialties: { id: string; name: string; slug: string }[];
}

export function SearchFilters({ specialties }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentClinic = searchParams.get("clinic") || "";
  const currentSpecialty = searchParams.get("specialty") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Clínica</h3>
        <div className="space-y-2">
          {clinics.map((clinic) => (
            <label
              key={clinic.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="clinic"
                value={clinic.id}
                checked={currentClinic === clinic.id}
                onChange={(e) => updateFilter("clinic", e.target.value)}
                className="accent-primary-600"
              />
              <ClinicLogo clinicId={clinic.id} size="sm" />
              <span className="text-sm text-neutral-700">{clinic.name}</span>
            </label>
          ))}
          {currentClinic && (
            <button
              onClick={() => updateFilter("clinic", "")}
              className="text-xs text-primary-600 hover:underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">
          Especialidad
        </h3>
        <select
          value={currentSpecialty}
          onChange={(e) => updateFilter("specialty", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas las especialidades</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
