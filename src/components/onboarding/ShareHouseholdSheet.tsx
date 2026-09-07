"use client";

import { useState } from "react";

interface ShareHouseholdSheetProps {
  householdName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareHouseholdSheet({ householdName, inviteCode, onClose }: ShareHouseholdSheetProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = `Rejoins notre calendrier "${householdName}" sur MyOldSharedCalendar. Code d'invitation : ${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoindre notre calendrier",
          text: shareMessage
        });
      } catch {
        // l'utilisateur a annule le partage, on ne fait rien
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <p className="font-semibold text-ink">Partager le calendrier</p>
        <button type="button" onClick={onClose} className="text-sm text-ink/60">
          Fermer
        </button>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-6">
        <p className="text-sm text-ink/70">
          Partage ce code avec ta famille pour qu'elle rejoigne le calendrier{" "}
          <strong>{householdName}</strong>.
        </p>

        <div className="rounded-xl border-2 border-dashed border-ink/30 py-6 flex items-center justify-center">
          <span className="text-3xl font-bold tracking-widest text-ink">{inviteCode}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-line py-3 font-semibold text-ink"
        >
          {copied ? "Code copie !" : "Copier le code"}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-ink text-paper py-3 font-semibold"
        >
          Partager via...
        </button>

        <p className="text-xs text-ink/50 text-center">
          La personne qui rejoint pourra utiliser l'application sans creer de compte, en
          saisissant simplement ce code.
        </p>
      </div>
    </div>
  );
}
