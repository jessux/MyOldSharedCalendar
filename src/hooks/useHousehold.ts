"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browserClient";
import type { Household, HouseholdMember, Calendar } from "@/types/database";

interface HouseholdData {
  household: Household | null;
  members: HouseholdMember[];
  calendars: Calendar[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHousehold(userId: string | undefined): HouseholdData {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      setHousehold(null);
      setMembers([]);
      setCalendars([]);
      setLoading(false);
      return;
    }

    const [{ data: h }, { data: m }, { data: c }] = await Promise.all([
      supabase.from("households").select("*").eq("id", membership.household_id).single(),
      supabase
        .from("household_members")
        .select("*, profile:profiles(*)")
        .eq("household_id", membership.household_id),
      supabase.from("calendars").select("*").eq("household_id", membership.household_id)
    ]);

    setHousehold(h ?? null);
    setMembers((m as unknown as HouseholdMember[]) ?? []);
    setCalendars(c ?? []);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { household, members, calendars, loading, refresh };
}
