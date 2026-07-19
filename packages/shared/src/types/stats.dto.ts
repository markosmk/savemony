export interface AnalyticsData {
  activePlans: number;
  totalSaved: number;
  totalTarget: number;
  topStats: {
    longestStreak: number;
    mostSaved: number;
  };
  monthlyData: {
    month: string;
    deposits: number;
    withdraws: number;
  }[];
}

export interface PredictionData {
  metrics: {
    currentBalance: number;
    goalAmount: number;
    remainingAmount: number;
    daysActive: number;
    depositCount: number;
  };
  rhythm: {
    dailySavingRate: number;
    averageDepositAmount: number;
  };
  prediction: {
    daysRemaining: string | number;
    estimatedCompletionDate: string | null;
  };
  projections: {
    estimatedBalanceIn30Days: number;
    estimatedBalanceIn90Days: number;
  };
}
