import type { Entry, PlanCreationFormValues, PlanDTO, PlanWithProgress, UpdatePlanPayload } from "@savemony/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { apiRequest } from "./core.api";

// corresponde al endpoint..
type ActionStatus = "archive" | "complete" | "reactivate";

export const plansService = {
  async getPlans(): Promise<PlanWithProgress[]> {
    const data = await apiRequest<{ plans: PlanWithProgress[] }>("/api/plans");
    return data.plans;
  },

  async getPlanById(planId: string) {
    const data = await apiRequest<{ plan: PlanDTO }>(`/api/plans/${planId}`);
    return data.plan;
  },

  async getPlanByIdSummary(planId: string) {
    const data = await apiRequest<{ plan: PlanDTO; entries: Entry[] }>(`/api/plans/${planId}/summary`);
    return data;
  },

  async createPlan(input: PlanCreationFormValues): Promise<PlanDTO> {
    const data = await apiRequest<{ success: boolean; plan: PlanDTO }>("/api/plans", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.plan;
  },

  async updatePlan(planId: string, body: UpdatePlanPayload): Promise<{ success: boolean }> {
    return await apiRequest<{ success: boolean }>(`/api/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async statusPlan(planId: string, action: ActionStatus) {
    return await apiRequest<{ success: boolean }>(`/api/plans/${planId}/${action}`, {
      method: "PATCH",
    });
  },

  async archivePlan(planId: string) {
    return await apiRequest<{ success: boolean }>(`/api/plans/${planId}/archive`, {
      method: "PATCH",
    });
  },

  async completePlan(planId: string) {
    return await apiRequest<{ success: boolean }>(`/api/plans/${planId}/complete`, {
      method: "PATCH",
    });
  },

  async reactivatePlan(planId: string) {
    return await apiRequest<{ success: boolean }>(`/api/plans/${planId}/reactivate`, {
      method: "PATCH",
    });
  },

  /** this check if plan is archived.. to delete */
  async deletePlan(planId: string): Promise<void> {
    await apiRequest<void>(`/api/plans/${planId}`, { method: "DELETE" });
  },

  async duplicatePlan(planId: string) {
    const data = await apiRequest<{ success: boolean; newPlan: PlanDTO }>(`/api/plans/${planId}/duplicate`, {
      method: "POST",
    });
    return data.newPlan;
  },
};

/**
 * HOOKS TANSTACK
 */

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: plansService.getPlans,
  });
}

export function usePlan(planId: string) {
  return useQuery({
    queryKey: ["plans", planId],
    queryFn: () => plansService.getPlanByIdSummary(planId),
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanCreationFormValues) => plansService.createPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanPayload }) => plansService.updatePlan(id, data),
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["plans", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useStatusPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ActionStatus }) => plansService.statusPlan(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: string) => plansService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      navigate({ to: "/panel" });
    },
  });
}

export function useDuplicatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => plansService.duplicatePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}
