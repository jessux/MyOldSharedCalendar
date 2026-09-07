"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browserClient";

interface HouseholdOnboardingProps {
  userId: string;
  onComplete: () => void;
}

type Mode = "choice" | "create" | "join";

export function HouseholdOnboarding({ userId, onComplete }: HouseholdOnboardingProps) {
  const [mode, setMode] = useState<Mode>("choice");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  const handleCreate = async () => {
    if (!householdName.trim()) {
      setError("Merci d'indiquer un nom de foyer.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({ name: householdName.trim(), created_by: userId })
      .select()
      .single();

    if (householdError || !household) {
      setError("Impossible de créer le foyer. Réessaie.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("household_members")
      .insert({ household_id: household.id, user_id: userId, role: "admin" });

    if (memberError) {
      setError("Le foyer a été créé mais l'ajout du membre a échoué. Réessaie.");
      setLoading(false);
      return;
    }

    const { error: calendarError } = await supabase
      .from("calendars")
      .insert({ household_id: household.id, name: "Calendrier familial" });

    if (calendarError) {
      setError("Le foyer a été créé mais la création du calendrier a échoué.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onComplete();
  };

  const handleJoin = async () => {
    const trimmedCode = inviteCode.trim().toLowerCase();
    if (!trimmedCode) {
      setError("Merci de saisir un code d'invitation.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("join_household_by_invite_code", {
      p_invite_code: trimmedCode
    });

    if (rpcError) {
      if (rpcError.code === "P0002" || rpcError.message?.includes("invite_code_not_found")) {
        setError("Code d'invitation introuvable. Vérifie qu'il est correctement saisi.");
      } else {
        setError("Une erreur est survenue. Réessaie.");
      }
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("Code d'invitation introuvable. Vérifie qu'il est correctement saisi.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onComplete();
  };

  if (mode === "choice") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-6">
        <h1 className="text-xl font-bold text-ink text-center">Bienvenue sur ton calendrier familial</h1>
        <button
          type="button"
          onClick={() => setMode("create")}
          className="w-full max-w-xs bg-ink text-paper rounded-lg py-3 font-semibold"
        >
          Créer un foyer
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className="w-full max-w-xs border border-line rounded-lg py-3 font-semibold text-ink"
        >
          Rejoindre un foyer existant
        </button>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-6">
        <h1 className="text-lg font-bold text-ink text-center">Nom du foyer</h1>
        <input
          type="text"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          placeholder="Ex. Famille Kahlouche"
          className="w-full max-w-xs border border-line rounded-lg px-3 py-2 text-ink"
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={handleCreate}
          className="w-full max-w-xs bg-ink text-paper rounded-lg py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer"}
        </button>
        <button type="button" onClick={() => setMode("choice")} className="text-sm text-ink/60 underline">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-6">
      <h1 className="text-lg font-bold text-ink text-center">Code d'invitation</h1>
      <input
        type="text"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        placeholder="Ex. 876b8fe0"
        className="w-full max-w-xs border border-line rounded-lg px-3 py-2 text-ink tracking-wide"
        autoCapitalize="none"
        autoCorrect="off"
      />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={handleJoin}
        className="w-full max-w-xs bg-ink text-paper rounded-lg py-3 font-semibold disabled:opacity-50"
      >
        {loading ? "Recherche…" : "Rejoindre"}
      </button>
      <button type="button" onClick={() => setMode("choice")} className="text-sm text-ink/60 underline">
        Retour
      </button>
    </div>
  );
}
