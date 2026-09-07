"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function LoginScreen() {
  const { sendOtpCode, verifyOtpCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Indique ton e-mail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sendOtpCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Indique le code recu par e-mail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyOtpCode(email.trim(), code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide ou expire.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center px-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">MyOldSharedCalendar</h1>
        <p className="text-sm text-ink/60 mt-1">
          Le calendrier familial partage, aussi simple qu'un calendrier papier.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {step === "email" ? (
        <>
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
            onClick={handleSendCode}
            className="rounded-full bg-ink text-paper py-3 font-semibold disabled:opacity-40"
          >
            {submitting ? "Envoi..." : "Recevoir un code de connexion"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink/70">
            Un code a 6 chiffres vient d'etre envoye a <strong>{email}</strong>. Saisis-le
            ci-dessous.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60 uppercase">Code recu</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="rounded-lg border border-line px-3 py-2 bg-white text-ink text-center text-2xl tracking-widest"
            />
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={handleVerifyCode}
            className="rounded-full bg-ink text-paper py-3 font-semibold disabled:opacity-40"
          >
            {submitting ? "Verification..." : "Valider le code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-sm text-ink/60"
          >
            Changer d'e-mail ou renvoyer un code
          </button>
        </>
      )}
    </div>
  );
}
