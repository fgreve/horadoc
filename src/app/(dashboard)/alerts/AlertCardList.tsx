"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Alert = {
  id: string;
  doctor_name_query: string | null;
  specialty_id: string | null;
  clinic_ids: string[];
  date_from: string | null;
  date_to: string | null;
  time_from: string | null;
  time_to: string | null;
  days_of_week: number[];
  include_telemedicine: boolean;
  channel: string;
  status: string;
  times_triggered: number;
  max_triggers: number;
  created_at: string;
  doctor: { name: string } | null;
  specialty: { name: string } | null;
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  triggered: "bg-blue-100 text-blue-700",
  expired: "bg-neutral-100 text-neutral-500",
};

const statusLabels: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  triggered: "Disparada",
  expired: "Expirada",
};

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AlertCardList({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const supabase = createClient();

  async function toggleAlert(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("alerts")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar la alerta");
      return;
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    toast.success(
      newStatus === "active" ? "Alerta activada" : "Alerta pausada"
    );
  }

  async function deleteAlert(id: string) {
    const { error } = await supabase.from("alerts").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar la alerta");
      return;
    }

    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alerta eliminada");
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white rounded-xl border border-neutral-200 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[alert.status] || statusColors.expired}`}
                >
                  {statusLabels[alert.status] || alert.status}
                </span>
                <span className="text-xs text-neutral-400">
                  Disparada {alert.times_triggered}/{alert.max_triggers} veces
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {alert.doctor?.name && (
                  <span className="inline-flex px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                    {alert.doctor.name}
                  </span>
                )}
                {alert.doctor_name_query && (
                  <span className="inline-flex px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                    &quot;{alert.doctor_name_query}&quot;
                  </span>
                )}
                {alert.specialty?.name && (
                  <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                    {alert.specialty.name}
                  </span>
                )}
                {alert.clinic_ids?.length > 0 &&
                  alert.clinic_ids.map((c) => (
                    <span
                      key={c}
                      className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize"
                    >
                      {c}
                    </span>
                  ))}
                {alert.time_from && alert.time_to && (
                  <span className="inline-flex px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">
                    {alert.time_from.slice(0, 5)} - {alert.time_to.slice(0, 5)}
                  </span>
                )}
                {alert.days_of_week?.length > 0 &&
                  alert.days_of_week.length < 7 && (
                    <span className="inline-flex px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">
                      {alert.days_of_week.map((d) => dayLabels[d]).join(", ")}
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleAlert(alert.id, alert.status)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alert.status === "active" ? "bg-primary-500" : "bg-neutral-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alert.status === "active" ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
