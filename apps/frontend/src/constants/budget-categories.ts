import type { BudgetCategory, BudgetCategoryInfo } from "@/types/app";

export const BUDGET_CATEGORIES: BudgetCategoryInfo[] = [
  {
    id: "vacations",
    label: "Vacaciones",
    icon: "✈️",
    color: "text-sky-700 dark:text-sky-300",
    bgColor: "bg-sky-100",
    borderColor: "border-sky-200",
    darkBgColor: "dark:bg-sky-900/40",
    darkBorderColor: "dark:border-sky-700",
  },
  {
    id: "emergency",
    label: "Emergencia",
    icon: "🛡️",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    darkBgColor: "dark:bg-red-900/40",
    darkBorderColor: "dark:border-red-700",
  },
  {
    id: "education",
    label: "Educación",
    icon: "🎓",
    color: "text-violet-700 dark:text-violet-300",
    bgColor: "bg-violet-100",
    borderColor: "border-violet-200",
    darkBgColor: "dark:bg-violet-900/40",
    darkBorderColor: "dark:border-violet-700",
  },
  {
    id: "technology",
    label: "Tecnología",
    icon: "💻",
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-200",
    darkBgColor: "dark:bg-cyan-900/40",
    darkBorderColor: "dark:border-cyan-700",
  },
  {
    id: "home",
    label: "Hogar",
    icon: "🏠",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    darkBgColor: "dark:bg-amber-900/40",
    darkBorderColor: "dark:border-amber-700",
  },
  {
    id: "health",
    label: "Salud",
    icon: "❤️",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-200",
    darkBgColor: "dark:bg-rose-900/40",
    darkBorderColor: "dark:border-rose-700",
  },
  {
    id: "transportation",
    label: "Transporte",
    icon: "🚗",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
    darkBgColor: "dark:bg-emerald-900/40",
    darkBorderColor: "dark:border-emerald-700",
  },
  {
    id: "other",
    label: "Otro",
    icon: "📌",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    darkBgColor: "dark:bg-gray-800/40",
    darkBorderColor: "dark:border-gray-600",
  },
];

export function getCategoryInfo(id: BudgetCategory | null | undefined): BudgetCategoryInfo | null {
  if (!id) return null;
  return BUDGET_CATEGORIES.find((c) => c.id === id) || null;
}
