"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { CalendarEvent, EventCategory, HouseholdMember } from "@/types/database";

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "famille", label: "Famille" },
  { value: "ecole", label: "École" },
  { value: "travail", label: "Travail" },
  { value: "sante", label: "Santé" },
  { value: "loisirs", label: "Loisirs" },
  { value: "autre", label: "Autre" }
];

export interface EventFormValues {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
}

interface EventFormSheetProps {
  initialDate: Date;
  existingEvent?: CalendarEvent;
  members: HouseholdMember[];
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EventFormSheet({
  initialDate,
  existingEvent,
  onCancel,
  onSubmit,
  onDelete
}: EventFormSheetProps) {
  const [title, setTitle] = useState(existingEvent?.title ?? "");
  const [description, setDescription] = useState(existingEvent?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(existingEvent?.category ?? "famille");
  const [allDay, setAllDay] = useState(existingEvent?.all_day ?? true);
  const [date, setDate] = useState(
    format(existingEvent ? new Date(existingEvent.starts_at) : initialDate, "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(
    existingEvent && !existingEvent.all_day ? format(new Date(existingEvent.starts_at), "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    existingEvent && !existingEvent.all_day ? format(new Date(existingEvent.ends_at), "HH:mm") : "10:00"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description, category, date, allDay, startTime, endTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60">
          Annuler
        </button>
        <p className="font-semibold text-ink">{existingEvent ? "Modifier" : "Nouvel événement"}</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-bold text-ink disabled:opacity-40"
        >
          {submitting ? "..." : "Enregistrer"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Titre</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Anniversaire de Léo"
            className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
          <span className="text-sm text-ink">Toute la journée</span>
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink/60 uppercase">Début</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink/60 uppercase">Fin</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
              />
            </label>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Catégorie</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Notes</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
          />
        </label>

        {existingEvent && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-2 rounded-lg border border-red-300 text-red-600 py-2 text-sm font-semibold"
          >
            Supprimer l'événement
          </button>
        )}
      </div>
    </div>
  );
}
