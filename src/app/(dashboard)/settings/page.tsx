"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const clinicOptions = [
  { id: "indisa" as const, label: "Indisa" },
  { id: "clc" as const, label: "CLC" },
  { id: "santa_maria" as const, label: "Santa María" },
  { id: "alemana" as const, label: "Alemana" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [preferredClinics, setPreferredClinics] = useState<("indisa" | "clc" | "santa_maria" | "alemana")[]>([]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setRut(profile.rut || "");
        setNotificationEmail(profile.notification_email || user.email || "");
        setWebhookUrl(profile.webhook_url || "");
        setPreferredClinics(profile.preferred_clinics || []);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function toggleClinic(id: "indisa" | "clc" | "santa_maria" | "alemana") {
    setPreferredClinics((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sesión expirada");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
        rut: rut,
        notification_email: notificationEmail,
        webhook_url: webhookUrl || null,
        preferred_clinics: preferredClinics,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Error al guardar los cambios");
      return;
    }

    toast.success("Cambios guardados");
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-neutral-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Configuración</h1>
        <p className="text-neutral-600 mt-1">
          Administra tu perfil y preferencias
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Datos personales
          </h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              RUT
            </label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Notificaciones
          </h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email para notificaciones
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Webhook URL (opcional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/..."
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Recibe notificaciones en Slack, Discord u otro servicio
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Clínicas preferidas
          </h2>
          <p className="text-sm text-neutral-500">
            Selecciona las clínicas que te interesan por defecto
          </p>
          <div className="flex flex-wrap gap-2">
            {clinicOptions.map((clinic) => (
              <button
                key={clinic.id}
                type="button"
                onClick={() => toggleClinic(clinic.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  preferredClinics.includes(clinic.id)
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {clinic.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
