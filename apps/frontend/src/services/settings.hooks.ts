import type { SettingsDTO, SettingsUpdateInput } from "@savemony/shared";
import type { Settings } from "@savemony/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "./core.api";

export function adapterSettings(raw: SettingsDTO): Settings {
  return {
    ...raw,
    reminderEnabled: Boolean(raw.reminderEnabled),
    achievementNotifs: Boolean(raw.achievementNotifs),
    weeklySummary: Boolean(raw.weeklySummary),
  };
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const res = await apiRequest<{ settings: SettingsDTO }>("/api/settings");
    return adapterSettings(res.settings);
  },

  async updateSettings(data: SettingsUpdateInput): Promise<Settings> {
    const res = await apiRequest<{ settings: SettingsDTO }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return adapterSettings(res.settings);
  },
};

/**
 * HOOKS TANSTACK
 */

export function useSettings() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettingsUpdateInput) => settingsService.updateSettings(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings", "profile"], updatedSettings);
      // También actualizar la sesión cacheada
      // queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
