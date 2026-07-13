import { useMemo } from "react";
import { ArrowUpRight, Calendar, FileText, PiggyBank, RefreshCw, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/constants/currencies";
import { getRelativeTime } from "@/lib/date-helper";
import { cn } from "@/lib/utils";
import type { TimelineEntryData } from "@/types/app";

interface LastTimelineEntryProps {
  entry?: TimelineEntryData | null;
  currency?: string;
}

const typeConfig = {
  save: {
    icon: PiggyBank,
    label: "Ahorro",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-100 dark:border-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    amountColor: "text-emerald-600 dark:text-emerald-400 font-semibold",
    prefix: "+",
  },
  withdraw: {
    icon: ArrowUpRight,
    label: "Retiro",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-100 dark:border-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    amountColor: "text-rose-600 dark:text-rose-400 font-semibold",
    prefix: "-",
  },
  adjust: {
    icon: RefreshCw,
    label: "Ajuste",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-100 dark:border-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    amountColor: "text-amber-600 dark:text-amber-400 font-semibold",
    prefix: "",
  },
  milestone: {
    icon: Trophy,
    label: "Hito",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-100 dark:border-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    amountColor: "text-indigo-600 dark:text-indigo-400 font-semibold",
    prefix: "",
  },
  note: {
    icon: FileText,
    label: "Nota",
    bg: "bg-slate-50 dark:bg-slate-950/20",
    border: "border-slate-100 dark:border-slate-900/30",
    iconColor: "text-slate-600 dark:text-slate-400",
    amountColor: "text-slate-600 dark:text-slate-400 font-semibold",
    prefix: "",
  },
};

export function LastTimelineEntry({ entry, currency }: LastTimelineEntryProps) {
  const displayTime = useMemo(() => {
    if (!entry) return "";
    // User requested: date can be null, fallback to createdAt
    const targetDate = entry.date || entry.createdAt;
    return getRelativeTime(targetDate);
  }, [entry]);

  if (!entry) return null;

  const config = typeConfig[entry.type] || typeConfig.note;
  const IconComponent = config.icon;

  return (
    <div className="mb-4">
      <div className="mb-1 px-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <span>Última actividad</span>
      </div>
      <Card className={cn("overflow-hidden p-0 border transition-all hover:bg-muted/5", config.bg, config.border)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg border shadow-sm",
                config.bg,
                config.border,
              )}
            >
              <IconComponent className={cn("size-5", config.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{config.label}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Calendar className="size-3" />
                  {displayTime}
                </span>
              </div>
              {entry.description && (
                <p className="mt-0.5 text-xs text-muted-foreground/90 line-clamp-1">{entry.description}</p>
              )}
              {entry.amount != null && (
                <p className={cn("mt-1 text-sm", config.amountColor)}>
                  {config.prefix}
                  {formatCurrency(entry.amount, currency)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
