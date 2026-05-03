import { Badge } from "@/components/ui/Badge";

interface AlertStatusBadgeProps {
  status: "active" | "paused" | "triggered" | "expired";
}

const config = {
  active: { variant: "success", label: "Activa" },
  paused: { variant: "warning", label: "Pausada" },
  triggered: { variant: "info", label: "Disparada" },
  expired: { variant: "neutral", label: "Expirada" },
} as const;

export function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
