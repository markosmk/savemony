import type { AchievementDTO } from "@savemony/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "./core.api";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await apiRequest<AchievementDTO[]>("/api/achievements");
      return res;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // En la API Hono, los logros se desbloquean automáticamente en el backend al marcar celdas.
      // Retornamos un objeto simulado para compatibilidad con el frontend anterior.
      return { newAchievements: [] as AchievementDTO[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}
