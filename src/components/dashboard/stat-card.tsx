import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

type Accent = "gold" | "warning" | "destructive";

const ACCENT_STYLES: Record<Accent, string> = {
  gold: "bg-primary/15 text-primary",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  isCurrency,
  helper,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  isCurrency?: boolean;
  helper?: string;
  accent?: Accent;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {isCurrency ? formatCurrency(value) : value.toLocaleString("es-PE")}
          </p>
          {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            accent && ACCENT_STYLES[accent]
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
