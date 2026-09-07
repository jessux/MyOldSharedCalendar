"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/browserClient";

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
    signOut
  };
}
