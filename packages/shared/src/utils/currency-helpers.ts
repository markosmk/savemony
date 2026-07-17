/**
 * Helpers de moneda. Todos los montos internos están en centavos (enteros).
 * La UI muestra la moneda formateada según el locale del usuario.
 */

const DEFAULT_LOCALE = "es-CL";

/**
 * Formatea un monto en centavos a string de moneda.
 * Ej: 100000 → "$100.000"
 * Ej: 1000000 → "$1.000.000"
 */
export function formatCurrency(amountInCents: number, locale: string = DEFAULT_LOCALE): string {
  const wholeUnits = Math.floor(amountInCents / 100);

  // Para pesos chilenos/argentinos/colombianos no mostramos decimales
  if (locale === "es-CL" || locale === "es-AR" || locale === "es-CO") {
    return `$${wholeUnits.toLocaleString("es-CL")}`;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: getCurrencyCode(locale),
  });
  return formatter.format(amountInCents / 100);
}

/**
 * Formatea un monto entero (ya en unidad mínima, ej. pesos) sin convertir de centavos.
 */
export function formatAmount(amount: number, locale: string = DEFAULT_LOCALE): string {
  if (locale === "es-CL" || locale === "es-AR" || locale === "es-CO") {
    return `$${amount.toLocaleString("es-CL")}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: getCurrencyCode(locale),
  }).format(amount);
}

/**
 * Parsea un input de usuario (ej. "$10.000" o "10000") a número entero.
 * Devuelve null si no es válido.
 */
export function parseCurrencyInput(input: string): number | null {
  if (!input || input.trim() === "") return null;

  const cleaned = input
    .replace(/[$\s.]/g, "") // quita $, espacios, puntos (miles)
    .replace(/,/g, "."); // convierte coma decimal a punto

  const num = Number(cleaned);
  if (Number.isNaN(num) || num < 0) return null;

  // Si el usuario escribió con decimales, convertimos a centavos
  if (cleaned.includes(".")) {
    return Math.round(num * 100);
  }
  return num; // asumimos que ya está en la unidad mínima
}

/**
 * Redondea hacia arriba al múltiplo más cercano.
 * Ej: roundUp(115400, 1000) → 116000
 */
export function roundUp(amount: number, to: number): number {
  return Math.ceil(amount / to) * to;
}

function getCurrencyCode(locale: string): string {
  const map: Record<string, string> = {
    "es-CL": "CLP",
    "es-AR": "ARS",
    "es-CO": "COP",
    "es-MX": "MXN",
    "es-ES": "EUR",
    "en-US": "USD",
  };
  return map[locale] || "USD";
}

export function getCurrencySymbol(locale: string = DEFAULT_LOCALE): string {
  if (locale) {
    if (locale === "es-CL" || locale === "es-AR" || locale === "es-CO") return "$";
    if (locale === "en-US") return "$";
    if (locale === "es-ES") return "€";
    if (locale === "es-MX") return "$";
  }
  return "$";
}
