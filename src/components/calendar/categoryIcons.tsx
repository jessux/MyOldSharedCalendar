import type { SVGProps } from "react";
import type { EventCategory } from "@/types/database";

export interface CategoryOption {
  value: EventCategory;
  label: string;
  color: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "famille", label: "Famille", color: "#e76f51" },
  { value: "ecole", label: "École", color: "#287b72" },
  { value: "travail", label: "Travail", color: "#5c78a8" },
  { value: "sante", label: "Santé", color: "#d04f61" },
  { value: "loisirs", label: "Loisirs", color: "#b47835" },
  { value: "autre", label: "Autre", color: "#6f7d79" }
];

export function getCategoryOption(category: EventCategory) {
  return CATEGORY_OPTIONS.find((option) => option.value === category) ?? CATEGORY_OPTIONS[5];
}

interface CategoryIconProps extends SVGProps<SVGSVGElement> {
  category: EventCategory;
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {category === "famille" && (
        <path d="M20.4 8.8c0 5.1-8.4 10.2-8.4 10.2S3.6 13.9 3.6 8.8a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6Z" />
      )}
      {category === "ecole" && (
        <>
          <path d="M4 5.7A2.7 2.7 0 0 1 6.7 3H20v16H6.7A2.7 2.7 0 0 1 4 16.3V5.7Z" />
          <path d="M4 6h16M8 3v16" />
        </>
      )}
      {category === "travail" && (
        <>
          <rect x="3.5" y="7" width="17" height="13" rx="2" />
          <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12h17M10 12v2h4v-2" />
        </>
      )}
      {category === "sante" && (
        <>
          <path d="M20.4 8.8c0 5.1-8.4 10.2-8.4 10.2S3.6 13.9 3.6 8.8a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6Z" />
          <path d="M12 8v5M9.5 10.5h5" />
        </>
      )}
      {category === "loisirs" && (
        <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3Z" />
      )}
      {category === "autre" && (
        <>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
