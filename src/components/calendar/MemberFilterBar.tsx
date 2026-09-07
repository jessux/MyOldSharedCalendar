"use client";

import clsx from "clsx";
import type { HouseholdMember } from "@/types/database";

interface MemberFilterBarProps {
  members: HouseholdMember[];
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
}

export function MemberFilterBar({ members, activeIds, onToggle }: MemberFilterBarProps) {
  if (members.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-2 pb-2">
      {members.map((member) => {
        const active = activeIds.size === 0 || activeIds.has(member.user_id);
        return (
          <button
            key={member.user_id}
            type="button"
            onClick={() => onToggle(member.user_id)}
            className={clsx(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap border",
              active ? "text-white border-transparent" : "text-ink/50 border-line bg-white"
            )}
            style={active ? { backgroundColor: member.color } : undefined}
          >
            <span>{member.profile?.avatar_emoji ?? "🙂"}</span>
            {member.profile?.display_name ?? "Membre"}
          </button>
        );
      })}
    </div>
  );
}
