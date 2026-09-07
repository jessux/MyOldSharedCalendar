"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function isRegisteredEmailError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("already been registered") || message.includes("already registered");
}

export function LoginScreen() {
  const { isAnonymous, linkEmailToAccount, sendOtpCode, verifyOtpCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "sent">("email");
  const [emailLoginFallback, setEmailLoginFallback] = useState(false);
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
      if (isAnonymous && !emailLoginFallback) {
        try {
          await linkEmailToAccount(email.trim());
          setStep("sent");
          return;
        } catch (err) {
          if (!isRegisteredEmailError(err)) throw err;
        }
      }

      await sendOtpCode(email.trim());
      setEmailLoginFallback(true);
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
      const message = err instanceof Error ? err.message : "";
      setError(
        /expired|invalid/i.test(message)
          ? "Le code a expiré ou n'est plus valide. Demande-en un nouveau."
          : message || "Code invalide ou expire."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError("Indique ton e-mail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setCode("");
    try {
      await sendOtpCode(email.trim());
      setEmailLoginFallback(true);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="calendar-auth">
      <div className="calendar-board calendar-auth-sheet flex flex-col justify-center gap-6">
      <div>
        <h1 className="calendar-auth-title">
          {isAnonymous ? "Sécurise ton accès" : "MyOldSharedCalendar"}
        </h1>
        <p className="calendar-auth-copy text-sm mt-1">
          {isAnonymous
            ? "Associe ton adresse e-mail pour retrouver ce foyer sur tes autres appareils."
            : "Le calendrier familial partagé, aussi simple qu'un calendrier papier."}
        </p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {step === "email" ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="calendar-auth-label">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@exemple.fr"
              className="calendar-auth-input"
            />
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSendCode}
            className="calendar-auth-button disabled:opacity-40"
          >
            {submitting
              ? "Envoi..."
              : isAnonymous
                ? "Recevoir le lien de confirmation"
                : "Recevoir un code de connexion"}
          </button>
        </>
      ) : step === "code" ? (
        <>
          <p className="text-sm text-stone-700">
            {emailLoginFallback
              ? "Cette adresse possède déjà un compte. Un code de connexion a été envoyé à "
              : "Un code de connexion vient d'etre envoye a "}
            <strong>{email}</strong>. Saisis-le ci-dessous.
          </p>
          <label className="flex flex-col gap-1">
            <span className="calendar-auth-label">Code recu</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="calendar-auth-input text-center text-2xl tracking-widest"
            />
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={handleVerifyCode}
            className="calendar-auth-button disabled:opacity-40"
          >
            {submitting ? "Verification..." : "Valider le code"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleResendCode}
            className="text-sm text-stone-600"
          >
            Renvoyer un code
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setEmailLoginFallback(false);
              setError(null);
            }}
            className="text-sm text-stone-600"
          >
            Changer d'e-mail
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-700">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Ouvre-le pour
            sécuriser l'accès à ton foyer.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setEmailLoginFallback(false);
              setError(null);
            }}
            className="text-sm text-stone-600"
          >
            Utiliser une autre adresse
          </button>
        </>
      )}
      </div>
    </div>
  );
}
