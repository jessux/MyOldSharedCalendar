"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browserClient";

interface HouseholdOnboardingProps {
  userId: string;
  onDone: () => void;
}

export function HouseholdOnboarding({ userId, onDone }: HouseholdOnboardingProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState("#4f83cc");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const ensureProfile = async () => {
    if (!displayName.trim()) throw new Error("Indique ton prenom.");
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: displayName.trim() });
    if (error) throw new Error(error.message);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Donne un nom a ton foyer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await ensureProfile();

      const { data: household, error: hErr } = await supabase
        .from("households")
        .insert({ name: name.trim(), created_by: userId })
        .select()
        .single();
      if (hErr || !household) throw new Error(hErr?.message ?? "Erreur de creation.");

      const { error: mErr } = await supabase.from("household_members").insert({
        household_id: household.id,
        user_id: userId,
        role: "admin",
        color
      });
      if (mErr) throw new Error(mErr.message);

      const { error: cErr } = await supabase.from("calendars").insert({
        household_id: household.id,
        name: "Famille",
        color
      });
      if (cErr) throw new Error(cErr.message);

      setCreatedInviteCode(household.invite_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("Indique le code d'invitation.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await ensureProfile();

      const { data: household, error: hErr } = await supabase
        .from("households")
        .select("*")
        .eq("invite_code", inviteCode.trim())
        .single();
      if (hErr || !household) throw new Error("Code d'invitation introuvable.");

      const { error: mErr } = await supabase.from("household_members").insert({
        household_id: household.id,
        user_id: userId,
        role: "member",
        color
      });
      if (mErr) throw new Error(mErr.message);

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdInviteCode) {
    const shareText = `Rejoins mon calendrier familial sur MyOldSharedCalendar ! Code d'invitation : ${createdInviteCode}`;

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ text: shareText });
        } catch {
          // partage annule, rien a faire
        }
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    };

    return (
      <div className="min-h-screen bg-paper flex flex-col justify-center px-6 py-10 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Foyer cree ! 🎉</h1>
          <p className="text-sm text-ink/60 mt-1">
            Partage ce code avec ta famille pour qu'elle rejoigne le calendrier.
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-line bg-white py-6 px-4 text-center">
          <p className="text-xs font-semibold text-ink/60 uppercase mb-1">Code d'invitation</p>
          <p className="text-3xl font-bold tracking-widest text-ink">{createdInviteCode}</p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-ink text-paper py-3 font-semibold"
        >
          Partager le code
        </button>

        <button type="button" onClick={onDone} className="text-sm text-ink/60">
          Continuer vers le calendrier
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center px-6 py-10 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Bienvenue 👋</h1>
        <p className="text-sm text-ink/60 mt-1">
          Cree un foyer partage ou rejoins celui de ta famille avec un code.
        </p>
      </div>

      <div className="flex rounded-full bg-line/40 p-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${
            mode === "create" ? "bg-ink text-paper" : "text-ink/60"
          }`}
        >
          Creer un foyer
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${
            mode === "join" ? "bg-ink text-paper" : "text-ink/60"
          }`}
        >
          Rejoindre
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink/60 uppercase">Ton prenom</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ex : Gabriel"
          className="rounded-lg border border-line px-3 py-2 bg-white text-ink"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink/60 uppercase">Ta couleur</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-16 rounded-lg border border-line bg-white"
        />
      </label>

      {mode === "create" ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Nom du foyer</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Famille Kahlouche"
            className="rounded-lg border border-line px-3 py-2 bg-white text-ink"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 uppercase">Code d'invitation</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Ex : a1b2c3d4"
            className="rounded-lg border border-line px-3 py-2 bg-white text-ink"
          />
        </label>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={mode === "create" ? handleCreate : handleJoin}
        className="rounded-full bg-ink text-paper py-3 font-semibold disabled:opacity-40"
      >
        {submitting ? "..." : mode === "create" ? "Creer mon foyer" : "Rejoindre le foyer"}
      </button>
    </div>
  );
}
