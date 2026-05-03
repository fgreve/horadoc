"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const PAGE_SIZE = 20;

interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const supabase = createClient();

  const fetchNotifications = useCallback(async (currentOffset: number, append: boolean) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (error) {
      setIsLoading(false);
      return;
    }

    if (data.length < PAGE_SIZE) {
      setHasMore(false);
    }

    if (append) {
      setNotifications((prev) => [...prev, ...data]);
    } else {
      setNotifications(data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications(0, false);
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    await fetchNotifications(newOffset, true);
  }, [offset, hasMore, isLoading, fetchNotifications]);

  return { notifications, isLoading, hasMore, loadMore };
}
