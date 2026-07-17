import type { AnalyticsData, PredictionData } from "@savemony/shared";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "./core.api";

export const statsService = {
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await apiRequest<{ success: boolean; data: AnalyticsData }>("/api/stats/analytics");
    return res.data;
  },

  async getPrediction(planId: string): Promise<PredictionData> {
    const res = await apiRequest<{ success: boolean; data: PredictionData }>(`/api/stats/prediction/${planId}`);
    return res.data;
  },
};

export function useAnalytics() {
  return useQuery({
    queryKey: ["stats", "analytics"],
    queryFn: statsService.getAnalytics,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function usePrediction(planId: string) {
  return useQuery({
    queryKey: ["stats", "prediction", planId],
    queryFn: () => statsService.getPrediction(planId),
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });
}
