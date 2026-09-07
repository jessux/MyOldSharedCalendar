"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent, HouseholdMember } from "@/types/database";
import { CategoryIcon, getCategoryOption } from "./categoryIcons";
import { PlusIcon } from "./icons";

interface DayDetailSheetProps {
  date: Date;
  events: CalendarEvent[];
  members: HouseholdMember[];
  onClose: () => void;
  onCreate: () => void;
  onEdit: (event: CalendarEvent) => void;
}

export function DayDetailSheet({
  date,
  events,
  members,
  onClose,
  onCreate,
  onEdit
}: DayDetailSheetProps) {
  const memberName = (userId: string | null) =>
    members.find((m) => m.user_id === userId)?.profile?.display_name ?? "Inconnu";

  const memberColor = (userId: string | null) =>
    members.find((m) => m.user_id === userId)?.color ?? "#4f83cc";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-paper shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-line">
        <p className="text-sm text-ink/60 capitalize">
          {format(date, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <button type="button" onClick={onClose} className="text-ink/60 text-sm font-medium px-2 py-1">
          Fermer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {events.length === 0 && (
          <p className="text-sm text-ink/50 py-6 text-center">Aucun événement ce jour-là.</p>
        )}

        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const category = getCategoryOption(event.category);

            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="calendar-detail-event w-full flex items-start gap-2 rounded-lg border border-line p-2 text-left"
                >
                  <span
                    className="calendar-event-category-icon flex-shrink-0"
                    style={{ color: category.color }}
                    title={category.label}
                  >
                    <CategoryIcon category={event.category} />
                  </span>
                  <span
                    className="calendar-event-member-dot mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color_override ?? memberColor(event.created_by) }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-ink text-sm truncate">{event.title}</span>
                    <span className="block text-xs text-ink/60">
                      {category.label}
                      {" · "}
                      {event.all_day
                        ? "Toute la journée"
                        : `${format(new Date(event.starts_at), "HH:mm")} - ${format(
                            new Date(event.ends_at),
                            "HH:mm"
                          )}`}
                      {" · "}
                      {memberName(event.created_by)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-4 py-3 border-t border-line">
        <button
          type="button"
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-ink text-paper py-3 font-semibold"
        >
          <PlusIcon />
          Ajouter un événement
        </button>
      </div>
    </div>
  );
}
