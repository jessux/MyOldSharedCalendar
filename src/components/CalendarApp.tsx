"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMonthGrid, monthLabel, nextMonth, previousMonth } from "@/lib/calendar/monthGrid";
import type { SchoolZone } from "@/lib/calendar/schoolHolidays";
import { MonthHeader } from "./calendar/MonthHeader";
import { MonthGrid } from "./calendar/MonthGrid";
import { MonthListView } from "./calendar/MonthListView";
import { MemberFilterBar } from "./calendar/MemberFilterBar";
import { DayDetailSheet } from "./calendar/DayDetailSheet";
import { EventFormSheet, type EventFormValues } from "./calendar/EventFormSheet";
import { ShareHouseholdSheet } from "./onboarding/ShareHouseholdSheet";
import { useHousehold } from "@/hooks/useHousehold";
import { useMonthEvents } from "@/hooks/useMonthEvents";
import { createBrowserClient } from "@/lib/supabase/browserClient";
import { checkForUpdate } from "@/lib/updater/checkForUpdate";
import type { CalendarEvent } from "@/types/database";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

interface CalendarAppProps {
  userId: string;
}

type ViewMode = "list" | "grid";

const SCHOOL_ZONE_STORAGE_KEY = "myoldsharedcalendar_school_zone";

function loadStoredZone(): SchoolZone {
  if (typeof window === "undefined") return "C";
  const stored = window.localStorage.getItem(SCHOOL_ZONE_STORAGE_KEY);
  if (stored === "A" || stored === "B" || stored === "C") return stored;
  return "C";
}

export function CalendarApp({ userId }: CalendarAppProps) {
  const [reference, setReference] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeMemberIds, setActiveMemberIds] = useState<Set<string>>(new Set());
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [schoolZone, setSchoolZone] = useState<SchoolZone>("C");
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; event: CalendarEvent } | null
  >(null);

  useEffect(() => {
    setSchoolZone(loadStoredZone());
    checkForUpdate(APP_VERSION).catch((error) => {
      console.error("Verification de mise a jour echouee:", error);
    });
  }, []);

  const changeZone = (zone: SchoolZone) => {
    setSchoolZone(zone);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SCHOOL_ZONE_STORAGE_KEY, zone);
    }
  };

  const { household, members, calendars, loading: householdLoading } = useHousehold(userId);
  const { events, loading: eventsLoading, refresh } = useMonthEvents(household?.id, reference);
  const supabase = createBrowserClient();

  const memberColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.user_id] = m.color;
    return map;
  }, [members]);

  const filteredEvents = useMemo(() => {
    if (activeMemberIds.size === 0) return events;
    return events.filter((e) => e.created_by && activeMemberIds.has(e.created_by));
  }, [events, activeMemberIds]);

  const cells = useMemo(() => buildMonthGrid(reference, filteredEvents), [reference, filteredEvents]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => {
      const start = new Date(e.starts_at);
      const end = new Date(e.ends_at);
      const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const en = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return day >= s && day <= en;
    });
  }, [filteredEvents, selectedDate]);

  const toggleMember = (userId: string) => {
    setActiveMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreateOrUpdate = async (values: EventFormValues) => {
    if (!household || calendars.length === 0) return;

    const startsAt = values.allDay ? `${values.date}T00:00:00` : `${values.date}T${values.startTime}:00`;
    const endsAt = values.allDay ? `${values.date}T23:59:59` : `${values.date}T${values.endTime}:00`;

    if (formState?.mode === "edit") {
      const { error } = await supabase
        .from("events")
        .update({
          title: values.title,
          description: values.description || null,
          category: values.category,
          all_day: values.allDay,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", formState.event.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("events").insert({
        calendar_id: calendars[0].id,
        household_id: household.id,
        created_by: userId,
        title: values.title,
        description: values.description || null,
        category: values.category,
        all_day: values.allDay,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString()
      });
      if (error) throw new Error(error.message);
    }

    setFormState(null);
    await refresh();
  };

  const handleDelete = async () => {
    if (formState?.mode !== "edit") return;
    const { error } = await supabase.from("events").delete().eq("id", formState.event.id);
    if (!error) {
      setFormState(null);
      await refresh();
    }
  };

  if (householdLoading) {
    return <div className="flex items-center justify-center h-screen text-ink/50">Chargement…</div>;
  }

  if (!household) {
    return null;
  }

  return (
    <div className="min-h-screen bg-paper pb-6">
      <div className="flex items-center justify-between px-3 pt-2 gap-2">
        <span className="text-xs font-semibold text-ink/50 truncate">{household.name}</span>
        <div className="flex items-center gap-2">
          <select
            value={schoolZone}
            onChange={(e) => changeZone(e.target.value as SchoolZone)}
            className="text-xs font-semibold text-ink bg-transparent border border-line rounded px-1"
            title="Zone scolaire"
          >
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>
          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
            className="text-xs font-semibold text-ink underline whitespace-nowrap"
          >
            {viewMode === "list" ? "Vue grille" : "Vue liste"}
          </button>
          <button
            type="button"
            onClick={() => setShowShareSheet(true)}
            className="text-xs font-semibold text-ink underline whitespace-nowrap"
          >
            Partager
          </button>
        </div>
      </div>

      <MonthHeader
        label={monthLabel(reference)}
        onPrev={() => setReference((r) => previousMonth(r))}
        onNext={() => setReference((r) => nextMonth(r))}
        onToday={() => setReference(new Date())}
        onSignOut={() => supabase.auth.signOut()}
      />

      <MemberFilterBar members={members} activeIds={activeMemberIds} onToggle={toggleMember} />

      <div className="px-2">
        {eventsLoading ? (
          <div className="text-center text-sm text-ink/40 py-10">Mise à jour…</div>
        ) : viewMode === "list" ? (
          <MonthListView
            cells={cells}
            memberColors={memberColors}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            schoolZone={schoolZone}
          />
        ) : (
          <MonthGrid
            cells={cells}
            memberColors={memberColors}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </div>

      {selectedDate && !formState && (
        <DayDetailSheet
          date={selectedDate}
          events={selectedDayEvents}
          members={members}
          onClose={() => setSelectedDate(null)}
          onCreate={() => setFormState({ mode: "create" })}
          onEdit={(event) => setFormState({ mode: "edit", event })}
        />
      )}

      {formState && selectedDate && (
        <EventFormSheet
          initialDate={selectedDate}
          existingEvent={formState.mode === "edit" ? formState.event : undefined}
          members={members}
          onCancel={() => setFormState(null)}
          onSubmit={handleCreateOrUpdate}
          onDelete={formState.mode === "edit" ? handleDelete : undefined}
        />
      )}

      {showShareSheet && (
        <ShareHouseholdSheet
          householdName={household.name}
          inviteCode={household.invite_code}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  );
}
