"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Alert = Database["public"]["Tables"]["alerts"]["Row"];
type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"];
type AlertUpdate = Database["public"]["Tables"]["alerts"]["Update"];

interface UseAlertsReturn {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  createAlert: (alert: AlertInsert) => Promise<Alert | null>;
  updateAlert: (id: string, updates: AlertUpdate) => Promise<Alert | null>;
  deleteAlert: (id: string) => Promise<boolean>;
  toggleAlert: (id: string) => Promise<Alert | null>;
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAlerts(data ?? []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(async (alert: AlertInsert): Promise<Alert | null> => {
    const { data, error: insertError } = await supabase
      .from("alerts")
      .insert(alert)
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    setAlerts((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateAlert = useCallback(async (id: string, updates: AlertUpdate): Promise<Alert | null> => {
    const { data, error: updateError } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    setAlerts((prev) => prev.map((a) => (a.id === id ? data : a)));
    return data;
  }, []);

  const deleteAlert = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from("alerts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    setAlerts((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  const toggleAlert = useCallback(async (id: string): Promise<Alert | null> => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return null;

    const newStatus = alert.status === "active" ? "paused" : "active";
    return updateAlert(id, { status: newStatus });
  }, [alerts, updateAlert]);

  return { alerts, isLoading, error, createAlert, updateAlert, deleteAlert, toggleAlert };
}
