import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  SEARCHING: { label: "Awaiting assignment", tone: "today" },
  MATCHED: { label: "Matched", tone: "success" },
  UNMATCHED: { label: "No pros available", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
} as const;

export function RequestStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}
