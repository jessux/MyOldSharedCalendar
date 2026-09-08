"use client";

import { useState } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import type { CalendarEvent, EventCategory, HouseholdMember } from "@/types/database";
import { CATEGORY_OPTIONS, CategoryIcon } from "./categoryIcons";

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "none", label: "Ne se répète pas" },
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Toutes les semaines" },
  { value: "monthly", label: "Tous les mois" },
  { value: "yearly", label: "Tous les ans" }
];

export interface EventFormValues {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  recurrenceFreq: RecurrenceFrequency;
  recurrenceCount: number;
}

interface EventFormSheetProps {
  initialDate: Date;
  existingEvent?: CalendarEvent;
  members: HouseholdMember[];
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
}

export function EventFormSheet({
  initialDate,
  existingEvent,
  onCancel,
  onSubmit,
  onDelete,
  onDuplicate
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
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        category,
        date,
        allDay,
        startTime,
        endTime,
        recurrenceFreq,
        recurrenceCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    setError(null);
    setDuplicating(true);
    try {
      await onDuplicate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setDuplicating(false);
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

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-ink/60 uppercase">Catégorie</span>
          <div className="calendar-category-grid" role="radiogroup" aria-label="Catégorie">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={category === option.value}
                onClick={() => setCategory(option.value)}
                className={clsx(
                  "calendar-category-option",
                  category === option.value && "is-active"
                )}
              >
                <span className="calendar-category-icon" style={{ color: option.color }}>
                  <CategoryIcon category={option.value} />
                </span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Notes</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
          />
        </label>

        {!existingEvent && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink/60 uppercase">Périodicité</span>
            <select
              value={recurrenceFreq}
              onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
              className="rounded-lg border border-line px-3 py-2 text-ink bg-white"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {recurrenceFreq !== "none" && (
              <label className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <span className="text-sm text-ink">Nombre d&apos;occurrences</span>
                <input
                  type="number"
                  min={2}
                  max={52}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(Math.min(52, Math.max(2, Number(e.target.value) || 2)))}
                  className="w-16 rounded-lg border border-line px-2 py-1 text-ink bg-white text-right"
                />
              </label>
            )}
          </div>
        )}

        {existingEvent && onDuplicate && (
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="mt-2 rounded-lg border border-line text-ink py-2 text-sm font-semibold disabled:opacity-40"
          >
            {duplicating ? "..." : "Dupliquer l'événement"}
          </button>
        )}

        {existingEvent && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-300 text-red-600 py-2 text-sm font-semibold"
          >
            Supprimer l&apos;événement
          </button>
        )}
      </div>
    </div>
  );
}
