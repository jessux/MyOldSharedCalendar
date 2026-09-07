"use client";

import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { HouseholdOnboarding } from "@/components/onboarding/HouseholdOnboarding";
import { CalendarApp } from "@/components/CalendarApp";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-screen text-ink/50">Chargement…</div>;
  }

  return <AuthenticatedArea userId={user.id} />;
}

function AuthenticatedArea({ userId }: { userId: string }) {
  const { household, loading, refresh } = useHousehold(userId);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-ink/50">Chargement…</div>;
  }

  if (!household) {
    return <HouseholdOnboarding userId={userId} onDone={refresh} />;
  }

  return <CalendarApp userId={userId} />;
}
