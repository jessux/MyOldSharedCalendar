"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Indique ton e-mail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center px-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">MyOldSharedCalendar</h1>
        <p className="text-sm text-ink/60 mt-1">
          Le calendrier familial partagé, aussi simple qu'un calendrier papier.
        </p>
      </div>

      {sent ? (
        <p className="text-sm text-ink/70">
          Un lien de connexion vient d'être envoyé à <strong>{email}</strong>. Ouvre-le
          depuis ce téléphone pour continuer.
        </p>
      ) : (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60 uppercase">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@exemple.fr"
              className="rounded-lg border border-line px-3 py-2 bg-white text-ink"
            />
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-full bg-ink text-paper py-3 font-semibold disabled:opacity-40"
          >
            {submitting ? "Envoi..." : "Recevoir un lien de connexion"}
          </button>
        </>
      )}
    </div>
  );
}
