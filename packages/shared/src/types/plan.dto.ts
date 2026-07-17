import type { FrequencyType, ISODate, PlanEntryType, PlanStatus } from "./app";

export interface Plan {
  id: string;
  userId: string;
  name: string;
  goalAmount: number | null;
  endDate: ISODate | null;
  frequencyType: FrequencyType;
  customDays?: number[] | null;
  suggestedQuota: number | null;
  quickAmounts?: number[] | null;
  isFlexible: boolean;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type PlanDTO = Omit<Plan, "updatedAt">;

export interface Entry {
  id: string;
  date: ISODate;
  type: PlanEntryType;
  planId: string;
  amount: number;
  reason: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EntryDTO extends Entry {
  // plan: PlanDTO;
}

export interface PlanWithProgress {
  id: string;
  name: string;
  status: PlanStatus;
  goalAmount: number | null;
  isFlexible: boolean;
  createdAt: string; // iso ex: 2026-07-17
  progress: {
    netSaved: number;
    totalDeposited: number;
    totalWithdrawn: number;
    percentage: number;
    remainingToGoal: number;
    isCompleted: boolean;
  };
  streak: {
    current: number;
    isActive: boolean;
    atRisk: boolean;
    longest: number;
  };
}

export interface SettingsDTO {
  id: string;
  userId: string;
  currency: string;
  locale: string;
  language: string;
  reminderEnabled: number;
  achievementNotifs: number;
  weeklySummary: number;
  createdAt: string;
  updatedAt: string;
}
