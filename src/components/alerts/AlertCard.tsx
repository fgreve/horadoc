"use client";

import { Bell, BellOff, Trash2, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ClinicLogo } from "@/components/shared/ClinicLogo";

interface Alert {
  id: string;
  doctor_name_query?: string | null;
  specialty?: { name: string } | null;
  clinic_ids: string[];
  date_from?: string | null;
  date_to?: string | null;
  time_from?: string | null;
  time_to?: string | null;
  days_of_week: number[];
  status: "active" | "paused" | "triggered" | "expired";
  times_triggered: number;
  max_triggers: number;
  channel: string;
}

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: string, status: "active" | "paused") => void;
  onDelete: (id: string) => void;
}

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const statusVariant = {
    active: "success",
    paused: "warning",
    triggered: "info",
    expired: "neutral",
  } as const;

  const statusLabel = {
    active: "Activa",
    paused: "Pausada",
    triggered: "Disparada",
    expired: "Expirada",
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[alert.status]}>
              {statusLabel[alert.status]}
            </Badge>
            <span className="text-xs text-neutral-500">
              Disparada {alert.times_triggered}/{alert.max_triggers} veces
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {alert.doctor_name_query && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium">
                Dr: {alert.doctor_name_query}
              </span>
            )}
            {alert.specialty && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium">
                {alert.specialty.name}
              </span>
            )}
            {alert.clinic_ids?.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-xs">
                <ClinicLogo clinicId={id as "indisa" | "clc" | "santa_maria" | "alemana"} size="sm" />
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
            {(alert.date_from || alert.date_to) && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {alert.date_from || "..."} - {alert.date_to || "..."}
              </span>
            )}
            {(alert.time_from || alert.time_to) && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {alert.time_from || "00:00"} - {alert.time_to || "23:59"}
              </span>
            )}
            {alert.days_of_week?.length > 0 && alert.days_of_week.length < 7 && (
              <span>
                {alert.days_of_week.map((d) => dayNames[d]).join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onToggle(alert.id, alert.status === "active" ? "paused" : "active")
            }
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
            title={alert.status === "active" ? "Pausar" : "Activar"}
          >
            {alert.status === "active" ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(alert.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
