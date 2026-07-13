import { useEffect, useState } from "react";
import { Archive, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { AnimatedDiv } from "@/components/animated-div";
import { CategoryBadge } from "@/components/shared/category-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/constants/currencies";
import { usePlans, useUpdatePlan } from "@/services/plans.hooks";
import type { PlanItem } from "@/types/app";

export function ArchivedPlansSection({ currency }: { currency: string }) {
  const [archivedPlans, setArchivedPlans] = useState<PlanItem[]>([]);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);

  const { data: plans, isLoading, error } = usePlans();
  const updatePlan = useUpdatePlan();

  useEffect(() => {
    if (plans) {
      setArchivedPlans(plans.filter((p) => p.archived));
    }
  }, [plans]);

  async function handleRestore(planId: string) {
    setIsRestoringId(planId);

    await updatePlan.mutateAsync(
      {
        id: planId,
        data: {
          archived: false,
        },
      },
      {
        onSuccess: () => {
          toast.success("Plan restaurado 📦");
        },
        onError: () => {
          toast.error("Error al restaurar");
        },
        onSettled: () => {
          setIsRestoringId(null);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <AnimatedDiv custom={4}>
        <Card className="mb-4 overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 rounded-lg" />
          </CardContent>
        </Card>
      </AnimatedDiv>
    );
  }

  if (error) {
    return (
      <AnimatedDiv custom={4}>
        <Card className="mb-4 overflow-hidden">
          <CardHeader className="pb-3">Error</CardHeader>
          <CardContent>Error al cargar los planes</CardContent>
        </Card>
      </AnimatedDiv>
    );
  }

  return (
    <AnimatedDiv custom={4}>
      <Card className="mb-4 overflow-hidden">
        <CardHeader className="pb-3 settings-gradient-header">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
              <Archive className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            Planes Archivados
          </CardTitle>
          <CardDescription className="ml-11">
            {archivedPlans.length} plan{archivedPlans.length !== 1 ? "es" : ""} archivado
            {archivedPlans.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {archivedPlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">
                Icono del plan o de la catgoria
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">{plan.title}</p>
                  <CategoryBadge category={plan.category} showLabel={false} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.progressPercent}% — {formatCurrency(plan.currentAmount, currency)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(plan.id)}
                disabled={!!isRestoringId}
                className="gap-1.5 shrink-0 text-xs"
              >
                {isRestoringId === plan.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RotateCcw className="size-3" />
                )}
                Restaurar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </AnimatedDiv>
  );
}
