import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { apiRequest } from "./core.api";

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    currentSessionId: string;
  };
}
export type UserAuth = UserSession["user"];

export const authService = {
  async getSession(): Promise<UserSession | null> {
    try {
      return await apiRequest<UserSession>("/api/auth/me");
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<UserSession> {
    return await apiRequest<UserSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signUp(
    email: string,
    password: string,
    name?: string,
    referredBy?: string,
  ): Promise<{ success: boolean; userId: string }> {
    return await apiRequest<{ success: boolean; userId: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, referredBy }),
    });
  },

  async signOut(): Promise<void> {
    await apiRequest<void>("/api/auth/logout", {
      method: "POST",
    });
  },
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: session,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: authService.getSession,
    staleTime: 1000 * 60 * 15, // Cache de la sesión por 15 minutos o hasta que se invalide
  });

  const signIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.signIn(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "session"], data);
      navigate({ to: "/panel" });
    },
  });

  const signUp = useMutation({
    mutationFn: ({
      email,
      password,
      name,
      referredBy,
    }: {
      email: string;
      password: string;
      name?: string;
      referredBy?: string;
    }) => authService.signUp(email, password, name, referredBy),
    onSuccess: () => {
      navigate({ to: "/login" });
    },
  });

  const signOut = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.clear(); // Limpia todo el caché de React Query
      navigate({ to: "/login" });
    },
  });

  return {
    user: session?.user ?? null,
    session,
    isLoading,
    isFetching,
    isAuthenticated: !!session?.user,
    signIn,
    signUp,
    signOut,
  };
}
