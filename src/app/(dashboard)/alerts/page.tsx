import Link from "next/link";
import { Plus, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AlertCardList } from "./AlertCardList";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from("alerts")
    .select(
      `
      id,
      doctor_name_query,
      specialty_id,
      clinic_ids,
      date_from,
      date_to,
      time_from,
      time_to,
      days_of_week,
      include_telemedicine,
      channel,
      status,
      times_triggered,
      max_triggers,
      created_at,
      doctor:doctors(name),
      specialty:specialties(name)
    `
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mis Alertas</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona tus alertas de disponibilidad
          </p>
        </div>
        <Link
          href="/alerts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva alerta
        </Link>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <BellRing className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            No tienes alertas configuradas
          </h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Crea tu primera alerta para recibir notificaciones cuando se
            liberen horas médicas que te interesen.
          </p>
          <Link
            href="/alerts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera alerta
          </Link>
        </div>
      ) : (
        <AlertCardList alerts={alerts} />
      )}
    </div>
  );
}
