"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function isRegisteredEmailError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("already been registered") || message.includes("already registered");
}

export function LoginScreen() {
  const { isAnonymous, linkEmailToAccount, sendOtpCode, verifyOtpCode, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "sent">("email");
  const [emailLoginFallback, setEmailLoginFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion Google.");
      setGoogleLoading(false);
    }
  };

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
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="calendar-auth-button calendar-auth-button-google disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
            </svg>
            {googleLoading ? "Connexion..." : "Continuer avec Google"}
          </button>

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="h-px flex-1 bg-stone-300" />
            ou
            <span className="h-px flex-1 bg-stone-300" />
          </div>

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
            Changer d&apos;e-mail
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-700">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Ouvre-le pour
            sécuriser l&apos;accès à ton foyer.
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
