/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation > */
import { useCallback, useMemo, useState } from "react";
import type { AdjustmentMode, AdjustmentResult, CalculationInput, PlanCreationFormValues } from "@savemony/shared";
import { adjustPlanByQuota, calculatePlanSummary, getEndDateFromMonths, PLAN_TEMPLATES } from "@savemony/shared";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

export function usePlanCalculator() {
  const { setValue } = useFormContext<PlanCreationFormValues>();

  const mode = useWatch({ name: "mode" });
  const goalAmount = useWatch({ name: "goalAmount" });
  const endDate = useWatch({ name: "endDate" });
  const frequencyType = useWatch({ name: "frequencyType" });
  const customDays = useWatch({ name: "customDays" });

  const [pendingQuota, setPendingQuota] = useState<number | null>(null);
  const [selectedAdjustmentMode, setSelectedAdjustmentMode] = useState<AdjustmentMode | null>(null);
  const [adjustmentResult, setAdjustmentResult] = useState<AdjustmentResult | null>(null);
  const [selectedTemplateId, onSelectedTemplateId] = useState<string | null>(null);

  const isValidForCalculation = Boolean(
    mode === "structured" &&
      goalAmount &&
      goalAmount > 0 &&
      endDate &&
      frequencyType &&
      (frequencyType !== "CUSTOM_DAYS" || (customDays && customDays.length > 0)),
  );

  const summary = useMemo(() => {
    if (!isValidForCalculation) return null;
    const input: CalculationInput = {
      goalAmount,
      endDate,
      frequencyType: frequencyType as CalculationInput["frequencyType"],
      customDays: customDays ?? undefined,
    };
    console.log({ input });
    const calc = calculatePlanSummary(input);
    return {
      suggestedQuota: calc.suggestedQuota,
      numberOfPeriods: calc.numberOfPeriods,
      totalAmount: calc.totalAmount,
      dailyAverage: calc.dailyAverage,
      depositDates: calc.depositDates,
    };
  }, [isValidForCalculation, goalAmount, endDate, frequencyType, customDays]);

  const handleQuotaChange = useCallback(
    (newQuota: number) => {
      if (!isValidForCalculation || !summary) return;
      if (newQuota === summary.suggestedQuota) {
        clearAdjustment();
        return;
      }
      setPendingQuota(newQuota);
      setSelectedAdjustmentMode(null);
      setAdjustmentResult(null);
    },
    [isValidForCalculation, summary],
  );

  const selectAdjustmentMode = useCallback(
    (mode: AdjustmentMode) => {
      if (!isValidForCalculation || !summary || pendingQuota === null) return;
      const input: CalculationInput = {
        goalAmount,
        endDate,
        frequencyType: frequencyType as CalculationInput["frequencyType"],
        customDays: customDays ?? undefined,
      };
      const result = adjustPlanByQuota(input, pendingQuota, mode);
      setSelectedAdjustmentMode(mode);
      setAdjustmentResult(result);
    },
    [isValidForCalculation, summary, pendingQuota, goalAmount, endDate, frequencyType, customDays],
  );

  const applyAdjustment = useCallback(() => {
    if (!adjustmentResult) return;
    if (adjustmentResult.mode === "adjust-goal") {
      setValue("goalAmount", adjustmentResult.adjustedGoalAmount, { shouldValidate: true });
    } else {
      setValue("endDate", adjustmentResult.adjustedEndDate, { shouldValidate: true });
    }
    setValue("suggestedQuota", adjustmentResult.newQuota, { shouldValidate: true });
    clearAdjustment();
  }, [adjustmentResult, setValue]);

  const clearAdjustment = useCallback(() => {
    setPendingQuota(null);
    setSelectedAdjustmentMode(null);
    setAdjustmentResult(null);
    // setValue("suggestedQuota", summary?.suggestedQuota, { shouldValidate: false });
  }, [summary?.suggestedQuota, setValue]);

  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = PLAN_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        toast.error("Plantilla no encontrada");
        return;
      }
      // change form..
      const end = getEndDateFromMonths(template.defaultMonths);
      setValue("mode", "structured");
      setValue("name", template.name);
      setValue("goalAmount", template.defaultGoalAmount);
      setValue("endDate", end);
      setValue("frequencyType", template.defaultFrequency);
      setValue("templateId", templateId);
    },
    [setValue],
  );

  const showAdjustmentToggle = pendingQuota !== null && selectedAdjustmentMode === null;
  console.log({ summary });
  return {
    summary,
    showAdjustmentToggle,
    adjustmentResult,
    selectedAdjustmentMode,
    handleQuotaChange,
    selectAdjustmentMode,
    applyAdjustment,
    clearAdjustment,
    applyTemplate,
    isValidForCalculation,
    // for handling template
    onSelectedTemplateId,
    selectedTemplateId,
  };
}
