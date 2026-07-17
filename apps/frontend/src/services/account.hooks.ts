import type { ProfileUpdatePayload, UpdatePasswordPayload } from "@savemony/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "./core.api";

type AccountResponse = {
  id: string;
  email: string;
  name: string;
};

export const accountService = {
  async updateProfile(data: ProfileUpdatePayload): Promise<AccountResponse> {
    const res = await apiRequest<{ success: boolean; user: AccountResponse; error?: string }>("/api/account", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.user;
  },

  async updatePassword(data: UpdatePasswordPayload): Promise<AccountResponse> {
    const res = await apiRequest<{ success: boolean; user: AccountResponse; error?: string }>(
      "/api/account/change-password",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    return res.user;
  },

  async deleteAccount(id: string) {
    const res = await apiRequest<{ success: boolean; message?: string; error?: string }>("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    return res?.message ?? "";
  },
};

/**
 * HOOKS TANSKTACK
 */

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => accountService.updateProfile(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings", "profile"], updatedSettings);
      // También actualizar la sesión cacheada
      // queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePasswordPayload) => accountService.updatePassword(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings", "profile"], updatedSettings);
      // También actualizar la sesión cacheada
      // queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
      // También actualizar la sesión cacheada
      // queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
