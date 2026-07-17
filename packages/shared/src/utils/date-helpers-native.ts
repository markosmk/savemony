/**
 * Facade de manejo de fechas.
 * Implementación interna usa dayjs. La API pública se mantiene estable.
 */

type ISODate = string; // "2026-07-16"
type ISODateTime = string; // "2026-07-16T10:00:00.000Z"

// ── Parsing / Formatting ──

function parseUTC(iso: ISODateTime | ISODate): Date {
  if (iso.includes("T")) {
    return new Date(iso); // Ya viene con timezone explícito
  }
  return new Date(`${iso}T00:00:00.000Z`);
}

export function toISODate(date: Date): ISODate {
  return date.toISOString().split("T")[0];
}

export function nowUTC(): ISODateTime {
  return new Date().toISOString();
}

export function todayUTC(): ISODate {
  // CORREGIDO: toISOString() siempre es UTC, no depende de timezone local
  return new Date().toISOString().split("T")[0];
}

// ── Zona horaria del usuario ──

export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "America/Argentina/Buenos_Aires";
}

/**
 * Convierte fecha local del usuario a UTC para BD.
 */
export function localToUTC(localDate: ISODate, timezone: string = getUserTimezone()): ISODateTime {
  // Usar dayjs internamente (o implementación manual para MVP)
  const date = new Date(`${localDate}T00:00:00`);
  return date.toISOString();
}

/**
 * Convierte UTC a fecha local del usuario para mostrar.
 */
export function utcToLocal(utcString: ISODateTime | ISODate, timezone?: string): ISODate {
  const date = parseUTC(utcString);
  const offset = getTimezoneOffsetMinutes(timezone || getUserTimezone(), date);
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return toISODate(local);
}

function getTimezoneOffsetMinutes(tz: string, date: Date): number {
  try {
    return new Date(date.toLocaleString("en-US", { timeZone: tz })).getTimezoneOffset();
  } catch {
    return date.getTimezoneOffset();
  }
}

// ── Operaciones UTC (usadas por calculator.ts) ──

export function addDaysUTC(iso: ISODate, days: number): ISODate {
  const date = parseUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function diffInDaysUTC(start: ISODate, end: ISODate): number {
  const s = parseUTC(start).getTime();
  const e = parseUTC(end).getTime();
  return Math.floor((e - s) / (1000 * 60 * 60 * 24));
}

export function getDayOfWeekUTC(iso: ISODate): number {
  return parseUTC(iso).getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sab
}

export function startOfWeekUTC(iso: ISODate): ISODate {
  const date = parseUTC(iso);
  const dow = date.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setUTCDate(date.getUTCDate() + diff);
  return toISODate(date);
}

export function endOfWeekUTC(iso: ISODate): ISODate {
  return addDaysUTC(startOfWeekUTC(iso), 6);
}

export function startOfMonthUTC(iso: ISODate): ISODate {
  const [y, m] = iso.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonthUTC(iso: ISODate): ISODate {
  const date = parseUTC(iso);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return toISODate(lastDay);
}

export function isWeekdayUTC(iso: ISODate): boolean {
  const dow = getDayOfWeekUTC(iso);
  return dow >= 1 && dow <= 5;
}

export function isTodayOrBefore(iso: ISODate): boolean {
  return iso <= todayUTC();
}

// ── NUEVAS: Funciones para cálculo de períodos ──

/**
 * Cuenta días hábiles (Lun-Vie) entre dos fechas INCLUSIVE.
 */
export function countWeekdays(start: ISODate, end: ISODate): number {
  let count = 0;
  let current = start;
  while (current <= end) {
    if (isWeekdayUTC(current)) count++;
    current = addDaysUTC(current, 1);
  }
  return count;
}

/**
 * Cuenta días personalizados entre dos fechas INCLUSIVE.
 */
export function countCustomDays(start: ISODate, end: ISODate, customDays: number[]): number {
  let count = 0;
  let current = start;
  while (current <= end) {
    if (customDays.includes(getDayOfWeekUTC(current))) count++;
    current = addDaysUTC(current, 1);
  }
  return count;
}

// ── Formato para mostrar ──

export function formatDateDisplay(iso: ISODate, timezone?: string): string {
  const date = parseUTC(iso);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
