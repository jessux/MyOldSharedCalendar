"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/browserClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const signingInRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        await ensureProfile(data.session.user.id);
        if (mounted) {
          setUser(data.session.user);
          setLoading(false);
        }
        return;
      }

      if (signingInRef.current) return;
      signingInRef.current = true;

      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (!error && anon.user) {
        await ensureProfile(anon.user.id);
      }
      if (mounted) {
        if (!error && anon.user) {
          setUser(anon.user);
        }
        setLoading(false);
      }
    };

    const ensureProfile = async (userId: string) => {
      await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: "Moi" }, { onConflict: "id", ignoreDuplicates: true });
    };

    init();

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
          shouldCreateUser: true
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
      const { error } = await supabase.auth.updateUser({ email });
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
