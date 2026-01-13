import { cn } from "@/lib/utils";
import { TriageClassification, triageConfig } from "@/types/occurrence";

interface TriageBadgeProps {
  triage: TriageClassification;
  size?: "sm" | "md";
}

export function TriageBadge({ triage, size = "md" }: TriageBadgeProps) {
  const config = triageConfig[triage];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {config.label}
    </span>
  );
}
