import type { CurrencyInfo } from "@/types/app";

export const CURRENCIES: CurrencyInfo[] = [
  { code: "CLP", symbol: "$", name: "Peso Chileno", locale: "es-CL" },
  { code: "ARS", symbol: "$", name: "Peso Argentino", locale: "es-AR" },
  { code: "MXN", symbol: "$", name: "Peso Mexicano", locale: "es-MX" },
  { code: "COP", symbol: "$", name: "Peso Colombiano", locale: "es-CO" },
  { code: "PEN", symbol: "S/", name: "Sol Peruano", locale: "es-PE" },
  { code: "USD", symbol: "$", name: "Dólar Americano", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "BRL", symbol: "R$", name: "Real Brasileño", locale: "pt-BR" },
  { code: "UYU", symbol: "$U", name: "Peso Uruguayo", locale: "es-UY" },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "$";
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatCurrency(amount: number, currency: string = "CLP"): string {
  const info = getCurrencyInfo(currency);
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      minimumFractionDigits:
        info.code === "CLP" || info.code === "ARS" || info.code === "COP" || info.code === "UYU" ? 0 : 2,
      maximumFractionDigits:
        info.code === "CLP" || info.code === "ARS" || info.code === "COP" || info.code === "UYU" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${info.symbol}${amount.toLocaleString()}`;
  }
}

export function formatCompact(amount: number, currency: string = "CLP"): string {
  const info = getCurrencyInfo(currency);
  if (amount >= 1000000) return `${info.symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${info.symbol}${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
  return `${info.symbol}${amount}`;
}
