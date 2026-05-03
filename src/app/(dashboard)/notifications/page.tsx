import { Bell, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      `
      id,
      channel,
      payload,
      sent_at,
      delivered,
      error,
      alert:alerts(id, doctor_name_query)
    `
    )
    .eq("user_id", user!.id)
    .order("sent_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Notificaciones</h1>
        <p className="text-neutral-600 mt-1">
          Historial de alertas enviadas
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            Sin notificaciones
          </h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            Cuando se detecte una hora que coincida con tus alertas, recibirás
            una notificación aquí y por email.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          {items.map((notification) => {
            const payload = notification.payload as Record<string, string>;
            return (
              <div
                key={notification.id}
                className="p-4 flex items-start gap-4"
              >
                <div className="mt-0.5">
                  {notification.delivered ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-neutral-800">
                      {payload?.doctor_name || "Hora disponible"}
                    </p>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                        notification.delivered
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {notification.delivered ? "Entregada" : "Fallida"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {payload?.clinic && <span>{payload.clinic}</span>}
                    {payload?.specialty && <span> - {payload.specialty}</span>}
                  </p>
                  {payload?.date && payload?.time && (
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Hora: {payload.date} a las {payload.time}
                    </p>
                  )}
                  {notification.error && (
                    <p className="text-xs text-red-500 mt-1">
                      Error: {notification.error}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-400">
                    {new Date(notification.sent_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(notification.sent_at).toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-neutral-300 mt-1 capitalize">
                    {notification.channel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
