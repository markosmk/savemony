import type { EntryDTO, UpdateEntryPayload, WithdrawalPayload } from "@savemony/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiRequest } from "./core.api";

export const entryService = {
  async getEntries(planId: string): Promise<EntryDTO[]> {
    const data = await apiRequest<{ entries: EntryDTO[] }>(`/api/plans/${planId}/entries`);
    return data.entries;
  },

  async updateEntry(input: UpdateEntryPayload, planId: string, entryId: string) {
    const data = await apiRequest<{ success: boolean; entry: EntryDTO }>(`/api/plans/${planId}/entries/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.entry;
  },

  async addDeposit(input: UpdateEntryPayload, planId: string) {
    const data = await apiRequest<{ success: boolean; entry: EntryDTO }>(`/api/plans/${planId}/entries/deposit`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.entry;
  },

  async addWithdraw(input: WithdrawalPayload, planId: string) {
    const data = await apiRequest<{ success: boolean; entry: EntryDTO }>(`/api/plans/${planId}/entries/withdrawal`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.entry;
  },

  async deleteEntry(planId: string, entryId: string) {
    return apiRequest<{ success: boolean }>(`/api/plans/${planId}/entries/${entryId}`, {
      method: "DELETE",
    });
  },
};

/**
 *  HOOKS TANSTACK QUERY
 */

export function usePlanEntries(planId: string) {
  return useQuery({
    queryKey: ["entries", planId],
    queryFn: () => entryService.getEntries(planId),
    enabled: !!planId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useUpdateEntry(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEntryPayload & { entryId: string }) => {
      const { entryId, ...rest } = input;
      return entryService.updateEntry(rest, planId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", planId] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      // queryClient.invalidateQueries({ queryKey: ["plans", planId] });
    },
  });
}

export function useAddDeposit(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateEntryPayload) => entryService.addDeposit(input, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", planId] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      // queryClient.invalidateQueries({ queryKey: ["plans", planId] });
      toast.success("Monto agregado exitosamente");
    },
    onError: () => {
      toast.error("Error al agregar el monto");
    },
  });
}

export function useAddWithdrawal(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WithdrawalPayload) => entryService.addWithdraw(input, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", planId] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      // queryClient.invalidateQueries({ queryKey: ["plans", planId] });
    },
  });
}

export function useDeleteEntry(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => entryService.deleteEntry(planId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", planId] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      // queryClient.invalidateQueries({ queryKey: ["plans", planId] });
    },
  });
}
