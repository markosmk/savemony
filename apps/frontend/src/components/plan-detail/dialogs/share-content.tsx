import { useMemo, useState } from "react";
import { CheckIcon, Copy, Share2, Star, TrophyIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/constants/currencies";
import { calculateLevel, getMotivationalQuote } from "@/lib/utils";
import type { PlanWithCells } from "@/types/app";

export function ShareContent({ plan }: { plan: PlanWithCells }) {
  const [copied, setCopied] = useState(false);

  const currency = "ARS"; // TODO: get oif config..

  const shareText = useMemo(() => {
    const quote = getMotivationalQuote(plan.progressPercent);
    return `🎯 ${plan.title}\n📊 ${plan.progressPercent}% completado\n💰 ${formatCurrency(plan.currentAmount, currency)} / ${formatCurrency(plan.targetAmount, currency)}\n✨ ${quote}`;
  }, [plan]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("¡Copiado al portapapeles!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi plan: ${plan.title}`,
          text: shareText,
        });
      } catch {
        // User cancelled
      }
    } else {
      await handleCopy();
    }
  }

  const level = calculateLevel(plan.progressPercent);

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl p-6 pb-5"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #047857 50%, #065f46 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

        {/* SaveGrid branding */}
        <div className="mb-4 flex items-center gap-1.5 opacity-60">
          <span className="text-[11px] font-semibold text-white/80">SaveMony</span>
        </div>

        {/* Plan info */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl backdrop-blur-sm">
            <TrophyIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-white">{plan.title}</h3>
            <div className="flex items-center gap-2">
              <Badge
                className="border-white/20 bg-white/15 text-[10px] font-semibold text-white hover:bg-white/20"
                style={{ padding: "1px 8px" }}
              >
                <Star className="mr-1 size-2.5" />
                Nivel {level}
              </Badge>
              <span className="text-xs text-white/70">
                {plan.completedCells}/{plan.totalCells} celdas
              </span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-end justify-between">
            <span className="text-3xl font-extrabold text-white">
              {plan.progressPercent}
              <span className="text-lg font-semibold text-white/70">%</span>
            </span>
            <span className="text-sm font-medium text-white/70">completado</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-all duration-700"
              style={{ width: `${plan.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase text-white/60">Ahorrado</p>
            <p className="text-base font-bold text-white">{formatCurrency(plan.currentAmount, currency)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase text-white/60">Meta</p>
            <p className="text-base font-bold text-white">{formatCurrency(plan.targetAmount, currency)}</p>
          </div>
        </div>

        {/* Quote */}
        <div className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
          <p className="text-xs italic text-white/90">✨ {getMotivationalQuote(plan.progressPercent)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
          {copied ? <CheckIcon className="size-4" /> : <Copy className="size-4" />}
          {copied ? "¡Copiado!" : "Copiar al portapapeles"}
        </Button>
        <Button onClick={handleShare} className="w-full gap-2">
          <Share2 className="size-4" />
          Compartir
        </Button>
      </div>
    </>
  );
}
