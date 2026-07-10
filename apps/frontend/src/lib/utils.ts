import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function calculateLevel(progressPercent: number): number {
	if (progressPercent >= 100) return 10;
	return Math.min(10, Math.floor(progressPercent / 10) + 1);
}

export function getMotivationalQuote(progressPercent: number): string {
	if (progressPercent === 0) return "¡El primer paso es el más importante! 🚀";
	if (progressPercent < 25) return "¡Gran inicio! Cada céntimo cuenta 💪";
	if (progressPercent < 50) return "Vas por muy buen camino 🌟";
	if (progressPercent < 75) return "¡Más de la mitad! No te detengas 🔥";
	if (progressPercent < 100) return "¡Ya casi lo logras! La meta está cerca 🎯";
	return "¡Objetivo cumplido! Eres increíble 🎉🏆";
}
