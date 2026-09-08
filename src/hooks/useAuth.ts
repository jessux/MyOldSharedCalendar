"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { createBrowserClient } from "@/lib/supabase/browserClient";

// Google refuse l'authentification OAuth depuis une WebView embarquee
// ("Error 400: disallowed_useragent"). Sur natif on ouvre donc Google
// dans le navigateur systeme et on recupere la session via ce deep link
// custom (intent-filter ajoute a l'AndroidManifest par le workflow CI).
const NATIVE_AUTH_REDIRECT_URL = "fr.kahlouche.myoldsharedcalendar://auth-callback";

function getAuthRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const initializationRef = useRef<Promise<User | null> | null>(null);

  useEffect(() => {
    let mounted = true;

    const ensureProfile = async (userId: string) => {
      await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: "Moi" }, { onConflict: "id", ignoreDuplicates: true });
    };

    const init = async () => {
      if (!initializationRef.current) {
        initializationRef.current = (async () => {
          const { data } = await supabase.auth.getSession();

          if (data.session?.user) {
            await ensureProfile(data.session.user.id);
            return data.session.user;
          }

          return null;
        })();
      }

      try {
        const initializedUser = await initializationRef.current;
        if (mounted) {
          setUser(initializedUser);
          setLoading(false);
        }
      } catch (error) {
        initializationRef.current = null;
        console.error("Initialisation auth echouee:", error);
        if (mounted) setLoading(false);
      }
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith(NATIVE_AUTH_REDIRECT_URL)) return;

      const hash = url.split("#")[1] ?? "";
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) console.error("Session Google invalide:", error);
      } else {
        console.error("Retour Google sans jeton de session:", url);
      }

      try {
        await Browser.close();
      } catch {
        // Deja ferme par l'utilisateur ou par le systeme, sans consequence.
      }
    });

    return () => {
      void listenerPromise.then((handle) => handle.remove());
    };
  }, [supabase]);

  const sendOtpCode = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getAuthRedirectUrl()
        }
      });
      if (error) throw error;
    },
    [supabase]
  );

  const verifyOtpCode = useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email"
      });
      if (error) throw error;
    },
    [supabase]
  );

  const linkEmailToAccount = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: getAuthRedirectUrl() }
      );
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: NATIVE_AUTH_REDIRECT_URL,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;
      if (data.url) await Browser.open({ url: data.url });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl()
      }
    });
    if (error) throw error;
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const isAnonymous = user ? !user.email : false;

  return {
    user,
    loading,
    isAnonymous,
    sendOtpCode,
    verifyOtpCode,
    linkEmailToAccount,
    signInWithGoogle,
    signOut
  };
}
