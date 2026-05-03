import Link from "next/link";
import { BellRing, Bell, CalendarCheck, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [alertsResult, notificationsResult, slotsResult, recentNotifications] =
    await Promise.all([
      supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "active"),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("sent_at", `${today}T00:00:00`),
      supabase
        .from("available_slots")
        .select("id", { count: "exact", head: true })
        .eq("is_available", true)
        .gte("date", today),
      supabase
        .from("notifications")
        .select("id, payload, sent_at, delivered, channel")
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(5),
    ]);

  const activeAlerts = alertsResult.count ?? 0;
  const todayNotifications = notificationsResult.count ?? 0;
  const detectedSlots = slotsResult.count ?? 0;
  const recentItems = recentNotifications.data ?? [];

  const summaryCards = [
    {
      label: "Alertas activas",
      value: activeAlerts,
      icon: BellRing,
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Notificaciones hoy",
      value: todayNotifications,
      icon: Bell,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Horas detectadas",
      value: detectedSlots,
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">
          Resumen de tu actividad en HoraDoc
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {card.value}
                </p>
                <p className="text-sm text-neutral-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/alerts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva alerta
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium text-sm hover:bg-neutral-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          Buscar médico
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          Actividad reciente
        </h2>
        {recentItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">
              Aún no tienes notificaciones. Crea una alerta para comenzar a
              recibir avisos.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {recentItems.map((item) => {
              const payload = item.payload as Record<string, string>;
              return (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${item.delivered ? "bg-emerald-500" : "bg-red-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {payload?.doctor_name || "Hora disponible detectada"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {payload?.clinic || ""}{" "}
                      {payload?.date ? `• ${payload.date}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {new Date(item.sent_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
