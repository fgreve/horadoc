"use client";

import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";
import { ClinicLogo } from "@/components/shared/ClinicLogo";
import { Badge } from "@/components/ui/Badge";

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    clinic_id: string;
    clinic_name: string;
    specialty: string | null;
    sede: string | null;
    next_available_date: string | null;
    available_slots_count: number;
  };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const hasSlots = doctor.available_slots_count > 0;

  return (
    <Link
      href={`/doctor/${doctor.id}`}
      className="block rounded-xl border border-[#e7e5e4] bg-white p-5 shadow-sm transition-all hover:border-[#99f6e4] hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <ClinicLogo
            clinicId={doctor.clinic_id as "indisa" | "clc" | "santa_maria" | "alemana"}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-[#1c1917]">{doctor.name}</h3>
            {doctor.specialty && (
              <p className="mt-0.5 text-sm text-[#57534e]">{doctor.specialty}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">
                {doctor.clinic_name}
              </Badge>
              {doctor.sede && (
                <Badge variant="neutral" size="sm">
                  {doctor.sede}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          {hasSlots ? (
            <>
              <Badge variant="success" size="md">
                {doctor.available_slots_count} hora
                {doctor.available_slots_count !== 1 ? "s" : ""} disponible
                {doctor.available_slots_count !== 1 ? "s" : ""}
              </Badge>
              {doctor.next_available_date && (
                <span className="flex items-center gap-1 text-xs text-[#57534e]">
                  <Calendar className="h-3 w-3" />
                  Proxima: {doctor.next_available_date}
                </span>
              )}
            </>
          ) : (
            <>
              <Badge variant="neutral" size="md">
                Sin disponibilidad
              </Badge>
              <Link
                href={`/alerts/new?doctor_id=${doctor.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-lg bg-[#ccfbf1] px-3 py-1.5 text-xs font-medium text-[#0d9488] transition-colors hover:bg-[#99f6e4]"
              >
                <AlertCircle className="h-3 w-3" />
                Crear alerta
              </Link>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
