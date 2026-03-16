import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  completed: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  paid: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  pending: "bg-warning/15 text-warning border-warning/25 hover:bg-warning/20",
  processing: "bg-warning/15 text-warning border-warning/25 hover:bg-warning/20",
  failed: "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/20",
  inactive: "bg-muted text-muted-foreground border-muted hover:bg-muted/80",
  draft: "bg-muted text-muted-foreground border-muted hover:bg-muted/80",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.draft;
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", style, className)}
    >
      {status}
    </Badge>
  );
}
