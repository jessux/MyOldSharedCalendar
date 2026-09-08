"use client";

import { useCallback, useEffect, useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { createBrowserClient } from "@/lib/supabase/browserClient";
import type { CalendarEvent } from "@/types/database";

export function useMonthEvents(householdId: string | undefined, reference: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const refresh = useCallback(async () => {
    if (!householdId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const rangeStart = startOfMonth(reference);
    const rangeEnd = endOfMonth(reference);
    const queryStart = new Date(rangeStart);
    queryStart.setDate(queryStart.getDate() - 7);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("household_id", householdId)
      .lte("starts_at", rangeEnd.toISOString())
      .gte("ends_at", queryStart.toISOString())
      .order("starts_at", { ascending: true });

    if (!error) {
      setEvents(data ?? []);
    }
    setLoading(false);
  }, [householdId, reference, supabase]);

  useEffect(() => {
    // Fetch-on-mount/dependency-change pattern: refresh() is async and awaits
    // Supabase before touching state, so this doesn't set state synchronously
    // despite what the (new, strict) rule below infers from the call graph.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`events-${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `household_id=eq.${householdId}` },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, refresh, supabase]);

  return { events, loading, refresh };
}
