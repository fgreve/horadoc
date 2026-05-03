"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Slot = Database["public"]["Tables"]["available_slots"]["Row"];

interface UseRealtimeSlotsReturn {
  slots: Slot[];
  isConnected: boolean;
}

export function useRealtimeSlots(doctorId: string): UseRealtimeSlotsReturn {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!doctorId) return;

    const fetchInitialSlots = async () => {
      const { data } = await supabase
        .from("available_slots")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("is_available", true)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        setSlots(data);
      }
    };

    fetchInitialSlots();

    const channel = supabase
      .channel(`slots:${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "available_slots",
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSlots((prev) => [...prev, payload.new as Slot]);
          } else if (payload.eventType === "UPDATE") {
            setSlots((prev) =>
              prev.map((s) => (s.id === (payload.new as Slot).id ? (payload.new as Slot) : s))
            );
          } else if (payload.eventType === "DELETE") {
            setSlots((prev) => prev.filter((s) => s.id !== (payload.old as Slot).id));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId]);

  return { slots, isConnected };
}
