export type FrequencyType = "DAILY" | "WEEKDAYS" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM_DAYS";

export type ISODate = string; // "2026-07-15"

export interface Entry {
  id: string;
  planId: string;
  date: ISODate;
  amount: number;
  type: "deposit" | "withdrawal";
  reason?: string;
}

export interface PlanTemplate {
  id: string;
  name: string;
  icon: string;
  defaultGoalAmount: number; // en centavos/unidad mínima
  defaultFrequency: FrequencyType;
  defaultMonths: number;
  description?: string;
}

export interface CalculationInput {
  goalAmount: number; // unidad mínima (ej. pesos enteros)
  endDate: ISODate;
  frequencyType: FrequencyType;
  customDays?: number[]; // 0=Dom, 1=Lun, ..., 6=Sab
  roundTo?: number; // default: 1000
}

export interface CalculationResult {
  suggestedQuota: number;
  numberOfPeriods: number;
  depositDates: ISODate[];
  totalAmount: number;
  dailyAverage: number;
}

export type AdjustmentMode = "adjust-date" | "adjust-goal";

export interface AdjustmentResult {
  mode: AdjustmentMode;
  newQuota: number;
  adjustedGoalAmount: number;
  adjustedEndDate: ISODate;
  adjustedPeriods: number;
  message: string;
}
