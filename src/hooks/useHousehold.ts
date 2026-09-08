"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browserClient";
import type { Household, HouseholdMember, Calendar } from "@/types/database";

interface HouseholdData {
  household: Household | null;
  households: Household[];
  members: HouseholdMember[];
  calendars: Calendar[];
  loading: boolean;
  refresh: () => Promise<void>;
  switchHousehold: (householdId: string) => void;
}

const ACTIVE_HOUSEHOLD_KEY_PREFIX = "myoldsharedcalendar_active_household_";

export function useHousehold(userId: string | undefined): HouseholdData {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const switchHousehold = useCallback(
    (householdId: string) => {
      if (userId && typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_HOUSEHOLD_KEY_PREFIX + userId, householdId);
      }
      setActiveId(householdId);
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId);

    const householdIds = (memberships ?? []).map((m) => m.household_id);

    if (householdIds.length === 0) {
      setHouseholds([]);
      setActiveId(null);
      setMembers([]);
      setCalendars([]);
      setLoading(false);
      return;
    }

    const { data: allHouseholds } = await supabase
      .from("households")
      .select("*")
      .in("id", householdIds);

    const sorted = (allHouseholds ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
    setHouseholds(sorted);

    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_HOUSEHOLD_KEY_PREFIX + userId) : null;
    const nextActiveId = stored && householdIds.includes(stored) ? stored : sorted[0]?.id ?? null;
    setActiveId(nextActiveId);

    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeId) {
      setMembers([]);
      setCalendars([]);
      return;
    }

    let cancelled = false;

    (async () => {
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from("household_members").select("*, profile:profiles(*)").eq("household_id", activeId),
        supabase.from("calendars").select("*").eq("household_id", activeId)
      ]);
      if (cancelled) return;
      setMembers((m as unknown as HouseholdMember[]) ?? []);
      setCalendars(c ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId, supabase]);

  const household = households.find((h) => h.id === activeId) ?? null;

  return { household, households, members, calendars, loading, refresh, switchHousehold };
}
