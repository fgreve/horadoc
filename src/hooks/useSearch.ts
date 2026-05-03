"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ClinicId = Database["public"]["Enums"]["clinic_id"];

interface SearchFilters {
  clinic?: ClinicId;
  specialty?: string;
}

interface DoctorResult {
  id: string;
  name: string;
  clinic_id: ClinicId;
  clinic_name: string;
  specialty: string | null;
  sede: string | null;
  next_available_date: string | null;
  available_slots_count: number;
}

interface UseSearchReturn {
  results: DoctorResult[];
  isLoading: boolean;
  error: string | null;
}

export function useSearch(query: string, filters: SearchFilters = {}): UseSearchReturn {
  const [results, setResults] = useState<DoctorResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query && !filters.clinic && !filters.specialty) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("search_doctors", {
          search_query: query || null,
          filter_clinic: filters.clinic || null,
          filter_specialty: filters.specialty || null,
          result_limit: 50,
        });

        if (rpcError) {
          setError(rpcError.message);
          setResults([]);
        } else {
          setError(null);
          setResults(data ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, filters.clinic, filters.specialty]);

  return { results, isLoading, error };
}
