import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutos de cache fresco
			retry: 1,
			refetchOnWindowFocus: false, // No recargar al volver a la pestaña
		},
		mutations: {
			retry: false,
		},
	},
});
