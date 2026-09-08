"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import clsx from "clsx";
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
import { enablePushNotifications } from "@/lib/notifications/push";
import type { CalendarEvent } from "@/types/database";
import { ChevronDown, GridIcon, ListIcon, LogOut } from "./calendar/icons";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

interface CalendarAppProps {
  userId: string;
}

type ViewMode = "list" | "grid";

const SCHOOL_ZONE_STORAGE_KEY = "myoldsharedcalendar_school_zone";
const SWIPE_THRESHOLD = 48;
const SWIPE_DIRECTION_RATIO = 1.2;

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; event: CalendarEvent } | null
  >(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSchoolZone(loadStoredZone());
    checkForUpdate(APP_VERSION).catch((error) => {
      console.error("Verification de mise a jour echouee:", error);
    });
  }, []);

  useEffect(() => {
    const eventId = new URLSearchParams(window.location.search).get("event");
    if (!eventId) return;

    createBrowserClient()
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const start = new Date(data.starts_at);
        setReference(start);
        setSelectedDate(start);
        setFormState({ mode: "edit", event: data as CalendarEvent });
        window.history.replaceState(null, "", window.location.pathname);
      });
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;

    const closeOnOutsidePointer = (event: Event) => {
      if (!(event.target instanceof Node) || !userMenuRef.current?.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setShowUserMenu(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showUserMenu]);

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

  const currentMember = members.find((member) => member.user_id === userId);

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

  const handleCalendarTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      swipeStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCalendarTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) >= SWIPE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_DIRECTION_RATIO;

    if (!isHorizontalSwipe) return;

    event.preventDefault();
    suppressClickRef.current = true;
    setReference((current) => (deltaX < 0 ? nextMonth(current) : previousMonth(current)));
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 500);
  };

  const handleCalendarClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
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

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await supabase.auth.signOut();
  };

  if (householdLoading) {
    return <div className="flex items-center justify-center h-screen text-ink/50">Chargement…</div>;
  }

  if (!household) {
    return null;
  }

  return (
    <div className="calendar-board min-h-screen pb-6">
      <div className="calendar-identity flex items-center justify-between gap-2 px-3 pt-4 pb-3">
        <div className="calendar-brand-block">
          <span className="calendar-kicker">Calendrier partagé</span>
          <span className="calendar-household truncate">{household.name}</span>
        </div>
        <div className="calendar-tool-row">
          <label className="calendar-zone-picker">
            <span className="sr-only">Zone scolaire</span>
            <select
              value={schoolZone}
              onChange={(e) => changeZone(e.target.value as SchoolZone)}
              title="Zone scolaire"
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>
          </label>
          <div className="calendar-view-switch" role="group" aria-label="Mode d'affichage">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={clsx("calendar-view-option", viewMode === "list" && "is-active")}
              aria-pressed={viewMode === "list"}
            >
              <ListIcon />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={clsx("calendar-view-option", viewMode === "grid" && "is-active")}
              aria-pressed={viewMode === "grid"}
            >
              <GridIcon />
              <span>Grille</span>
            </button>
          </div>
          <div className="calendar-user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="calendar-user-trigger"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-controls="calendar-user-dropdown"
              onClick={() => setShowUserMenu((open) => !open)}
            >
              <span className="calendar-user-avatar" aria-hidden="true">
                {currentMember?.profile?.avatar_emoji ?? "🙂"}
              </span>
              <span className="calendar-user-name">
                {currentMember?.profile?.display_name ?? "Utilisateur"}
              </span>
              <ChevronDown />
            </button>
            {showUserMenu && (
              <div id="calendar-user-dropdown" className="calendar-user-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="calendar-user-menu-item"
                  onClick={async () => {
                    try {
                      await enablePushNotifications(supabase, userId);
                    } catch (error) {
                      alert(error instanceof Error ? error.message : "Erreur notifications");
                    }
                    setShowUserMenu(false);
                  }}
                >
                  Activer les notifications
                </button>
                <button type="button" role="menuitem" className="calendar-user-menu-item" onClick={handleSignOut}>
                  <LogOut />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MonthHeader
        label={monthLabel(reference)}
        year={reference.getFullYear()}
        monthIndex={reference.getMonth()}
        onPrev={() => setReference((r) => previousMonth(r))}
        onNext={() => setReference((r) => nextMonth(r))}
        onToday={() => setReference(new Date())}
        onShare={() => setShowShareSheet(true)}
      />

      <MemberFilterBar members={members} activeIds={activeMemberIds} onToggle={toggleMember} />

      <div
        className="calendar-content touch-pan-y"
        onTouchStart={handleCalendarTouchStart}
        onTouchEnd={handleCalendarTouchEnd}
        onTouchCancel={() => {
          swipeStartRef.current = null;
        }}
        onClickCapture={handleCalendarClickCapture}
      >
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
