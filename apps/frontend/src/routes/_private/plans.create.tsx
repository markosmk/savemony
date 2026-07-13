import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type CreatePlanPayload, createPlanSchema } from "@savemony/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  Grid3X3Icon,
  SlidersIcon,
  SparklesIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

import { HeaderSection } from "@/components/header-section";
import { StepOne } from "@/components/onboarding/step-one";
import { StepThree } from "@/components/onboarding/step-three";
import { StepTwo } from "@/components/onboarding/step-two";
import { CelebrationScreen } from "@/components/shared/celebration-screen";
import { IndicatorStepper } from "@/components/shared/indicator-stepper";
import { Button, ButtonLoading } from "@/components/ui/button";
import { type StepConfig, useStepper } from "@/hooks/use-stepper";
import { formatDate } from "@/lib/date-helper";
import { useCreatePlan } from "@/services/plans.hooks";
import type { AmountMode, PlanFrequency, RebalanceMode, SavingsMethod } from "@/types/app";

export const Route = createFileRoute("/_private/plans/create")({
  component: ComponentPage,
});

const PLAN_STEPS: StepConfig<CreatePlanPayload>[] = [
  {
    title: "Objetivo",
    icon: SparklesIcon,
    fields: ["title", "targetAmount"],
  },
  {
    title: "Método",
    icon: Grid3X3Icon,
    fields: ["method", "gridRows", "gridCols", "frequency"],
  },
  {
    title: "Personalización",
    icon: SlidersIcon,
    fields: ["minAmount", "maxAmount", "rebalanceMode"],
  },
];

function ComponentPage() {
  const navigate = useNavigate();

  const form = useForm<CreatePlanPayload>({
    resolver: standardSchemaResolver(createPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 0,
      currency: "ARS",
      method: "custom_grid",
      gridRows: 6,
      gridCols: 7,
      minAmount: 0,
      maxAmount: 0,
      rebalanceMode: "proportional",
      frequency: "daily",
      deadline: undefined,
      amountMode: "preferred",
      preferredAmounts: [],
      roundingMultiple: 100,
      category: "",
    },
    mode: "onChange",
  });

  const { stepIndex, isFirstStep, isLastStep, goNext, goBack, goToStep } = useStepper({
    steps: PLAN_STEPS,
    triggerValidation: form.trigger,
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [planIdCreated, setPlanIdCreated] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    amount: string;
  } | null>(null);

  const mutationCreate = useCreatePlan();

  const handleCreate: SubmitHandler<CreatePlanPayload> = async (data: CreatePlanPayload) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const payload: CreatePlanPayload = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        targetAmount: Number(data.targetAmount),
        currency: data.currency || "ARS",
        method: (data.method as SavingsMethod) || "custom_grid",
        gridRows: data.gridRows || 10,
        gridCols: data.gridCols || 10,
        rebalanceMode: (data.rebalanceMode as RebalanceMode) || "proportional",
        frequency: (data.frequency as PlanFrequency) || "daily",
        amountMode: (data.amountMode as AmountMode) || "preferred",
        preferredAmounts: data.preferredAmounts || [],
        roundingMultiple: data.roundingMultiple || 2000,
        minAmount: data.minAmount || 0,
        maxAmount: data.maxAmount || 0,
        deadline: data.deadline ? formatDate(data.deadline, "YYYY-MM-DD") : null,
        category: data.category || "",
      };

      mutationCreate.mutate(payload, {
        onSuccess: async (data) => {
          toast.success("¡Plan creado!");
          setCelebrationData({
            title: payload.title,
            amount: payload.targetAmount.toString(),
          });
          setPlanIdCreated(data.id);
        },
        onError: (err: unknown) => {
          let message = "Error al crear el plan";

          if ((err as { error: unknown })?.error) {
            if (Array.isArray((err as { error: unknown }).error)) {
              // Valibot simplificado
              message = (err as { error: { key: string; message: string }[] }).error
                .map((e: { key: string; message: string }) => `${e.key}: ${e.message}`)
                .join(". ");
            } else {
              message = (err as { error: string }).error;
            }
          } else if ((err as Error)?.message) {
            message = (err as Error).message;
          }

          setServerError(message);
          setSubmitting(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setServerError(message);
      setSubmitting(false);
      toast.error(message);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreate)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        {/* TODO: when create new plan, not animated celebration, and when go to plan detail, flash showwing plan empty.. */}
        <CelebrationScreen
          amount={celebrationData?.amount}
          title={celebrationData?.title}
          onClose={() => {
            setCelebrationData(null);
            planIdCreated &&
              navigate({
                to: "/plans/$planId",
                params: { planId: planIdCreated },
              });
          }}
        />

        {/* Header area */}
        <div className="border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <HeaderSection
              title="Nuevo Plan de Ahorro"
              description={`Paso ${stepIndex + 1} de 3 — ${PLAN_STEPS[stepIndex].title}`}
              onBack={() => {
                if (stepIndex > 0) goBack();
                else navigate({ to: "/panel" });
              }}
            />

            <IndicatorStepper
              goToStep={goToStep}
              currentStep={stepIndex}
              steps={PLAN_STEPS.map((p) => ({ title: p.title, icon: p.icon }))}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${stepIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {stepIndex === 0 && <StepOne />}
              {stepIndex === 1 && <StepTwo />}
              {stepIndex === 2 && <StepThree />}
            </motion.div>
          </AnimatePresence>

          {serverError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{serverError}</p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="sticky bottom-0 z-10 bg-background/90 backdrop-blur-sm border-t border-border/50 -mx-4 px-4 py-3 mt-6">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                key="btn-back"
                type="button"
                disabled={isFirstStep || submitting}
                onClick={stepIndex > 0 ? goBack : () => navigate({ to: "/panel" })}
                className="gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {stepIndex > 0 ? "Anterior" : "Cancelar"}
              </Button>

              {!isLastStep ? (
                <Button key="btn-next" type="button" onClick={goNext}>
                  Siguiente
                  <ChevronRightIcon />
                </Button>
              ) : (
                <ButtonLoading
                  key="btn-submit"
                  type="submit"
                  isPending={submitting || mutationCreate.isPending}
                  className="gap-2 shadow-lg shadow-primary/25"
                >
                  Crear Plan
                </ButtonLoading>
              )}
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
