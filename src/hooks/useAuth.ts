"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/browserClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function ensureSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        if (mounted) {
          setUser(data.session.user);
          setLoading(false);
        }
        return;
      }

      const { data: anonData, error } = await supabase.auth.signInAnonymously();
      if (!mounted) return;

      if (error) {
        console.error("Connexion anonyme impossible :", error.message);
        setLoading(false);
        return;
      }

      setUser(anonData.user ?? null);
      setLoading(false);
    }

    ensureSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
