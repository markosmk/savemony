import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.locale("es");

type ISODate = string; // "2026-07-16"
type ISODateTime = string; // "2026-07-16T10:00:00.000Z"

const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

// ═══════════════════════════════════════════════════════════════════════════════
// Funciones UTC puros (usadas por calculator y lógica de negocio)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fecha de hoy en UTC como string YYYY-MM-DD.
 * Equivalente a new Date().toISOString().split("T")[0] pero con dayjs.
 * @return date in utc format ex: 2026-07-17
 */
export function todayUTC(): ISODate {
  return dayjs.utc().format("YYYY-MM-DD");
}

/**
 * Timestamp actual en UTC.
 * @return timestamp in utc format ex: 2026-07-17T13:32:32.567Z
 */
export function nowUTC(): ISODateTime {
  return dayjs.utc().toISOString();
}

/**
 * Parsea una fecha ISO (con o sin tiempo) a dayjs en modo UTC.
 * @return date in utc format ex: "2026-07-17"
 */
function parseUTC(iso: ISODate | ISODateTime): dayjs.Dayjs {
  if (iso.includes("T")) {
    return dayjs.utc(iso);
  }
  return dayjs.utc(`${iso}T00:00:00.000Z`);
}

/**
 * Convierte un objeto dayjs UTC a string YYYY-MM-DD.
 * @return date in iso format ex: "2026-07-17"
 */
function toISODate(d: dayjs.Dayjs): ISODate {
  return d.format("YYYY-MM-DD");
}

/**
 * Suma/resta días a una fecha UTC.
 * @return date in iso format ex: "2026-07-17"
 */
export function addDaysUTC(iso: ISODate, days: number): ISODate {
  return toISODate(parseUTC(iso).add(days, "day"));
}

/**
 * Diferencia en días entre dos fechas UTC.
 */
export function diffInDaysUTC(start: ISODate, end: ISODate): number {
  return parseUTC(end).diff(parseUTC(start), "day");
}

/**
 * Día de la semana en UTC: 0=Domingo, 1=Lunes, ..., 6=Sábado.
 */
export function getDayOfWeekUTC(iso: ISODate): number {
  return parseUTC(iso).day(); // day() en modo UTC devuelve UTC day
}

/**
 * Primer día de la semana (Lunes) en UTC.
 */
export function startOfWeekUTC(iso: ISODate): ISODate {
  const d = parseUTC(iso);
  const dow = d.day(); // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow;
  return toISODate(d.add(diff, "day"));
}

/**
 * Último día de la semana (Domingo) en UTC.
 */
export function endOfWeekUTC(iso: ISODate): ISODate {
  return addDaysUTC(startOfWeekUTC(iso), 6);
}

/**
 * Primer día del mes en UTC.
 */
export function startOfMonthUTC(iso: ISODate): ISODate {
  const [y, m] = iso.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

/**
 * Último día del mes en UTC.
 */
export function endOfMonthUTC(iso: ISODate): ISODate {
  const d = parseUTC(iso);
  const lastDay = d.endOf("month");
  return toISODate(lastDay);
}

/**
 * ¿Es día hábil? (Lun-Vie) en UTC.
 */
export function isWeekdayUTC(iso: ISODate): boolean {
  const dow = getDayOfWeekUTC(iso);
  return dow >= 1 && dow <= 5;
}

/**
 * ¿La fecha es hoy o anterior? (comparación de strings ISO).
 */
export function isTodayOrBefore(iso: ISODate): boolean {
  return iso <= todayUTC();
}

/**
 * Número de días del mes en UTC.
 */
export function getDaysInMonthUTC(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1-12
}

// ═══════════════════════════════════════════════════════════════════════════════
// Funciones con timezone (para frontend, formateo, display)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Zona horaria del usuario (navegador) o fallback.
 */
export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Convierte fecha local del usuario a UTC para guardar en BD.
 * Ej: localToUTC("2026-07-16", "America/Santiago") → "2026-07-16T04:00:00.000Z"
 */
export function localToUTC(localDate: ISODate, timezone: string = getUserTimezone()): ISODateTime {
  return dayjs.tz(`${localDate}T00:00:00`, timezone).utc().toISOString();
}

/**
 * Convierte UTC a fecha local del usuario para mostrar.
 * Ej: utcToLocal("2026-07-16T04:00:00.000Z", "America/Santiago") → "2026-07-16"
 */
export function utcToLocal(utcString: ISODateTime | ISODate, timezone?: string): ISODate {
  const tz = timezone || getUserTimezone();
  return dayjs.utc(utcString).tz(tz).format("YYYY-MM-DD");
}

/**
 * Formatea una fecha UTC para mostrar en la zona del usuario.
 */
export function formatDate(
  utcString: ISODateTime | ISODate,
  format: string = "dddd, D [de] MMMM [de] YYYY, h:mm a",
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return dayjs.utc(utcString).tz(timezone).format(format);
}

/**
 * Formato corto: "16/07/2026 14:30"
 */
export function formatDateTime(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): string {
  return dayjs.utc(utcString).tz(timezone).format("DD/MM/YYYY HH:mm");
}

/**
 * Formato largo legible: "miércoles 16 de julio de 2026"
 */
export function formatDateLong(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): string {
  return dayjs.utc(utcString).tz(timezone).format("dddd D [de] MMMM [de] YYYY");
}

/**
 * Hora solamente: "14:30"
 */
export function formatTime(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): string {
  return dayjs.utc(utcString).tz(timezone).format("HH:mm");
}

/**
 * Tiempo relativo: "hace 2 horas", "en 3 días"
 */
export function getRelativeTime(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): string {
  const target = dayjs.utc(utcString).tz(timezone);
  const now = dayjs().tz(timezone);
  const diffSeconds = target.diff(now, "second");

  if (diffSeconds < 0) {
    return `hace ${target.fromNow(true)}`;
  }
  if (diffSeconds < 60) {
    return "menos de 1 minuto";
  }
  return `en ${target.fromNow(true)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Comparaciones con timezone
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ¿Es fecha futura (desde ahora en la zona dada)?
 */
export function isFuture(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): boolean {
  return dayjs.utc(utcString).tz(timezone).isAfter(dayjs().tz(timezone), "day");
}

/**
 * ¿Es hoy (mismo día) en la zona horaria dada?
 */
export function isToday(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): boolean {
  return dayjs.utc(utcString).tz(timezone).isSame(dayjs().tz(timezone), "day");
}

/**
 * ¿Es antes de otra fecha (o antes de hoy)?
 */
export function isBefore(
  date: ISODateTime | ISODate,
  comparisonDate?: ISODateTime | ISODate,
  timezone: string = DEFAULT_TIMEZONE,
): boolean {
  const d1 = dayjs.utc(date).tz(timezone);
  const d2 = comparisonDate ? dayjs.utc(comparisonDate).tz(timezone) : dayjs().tz(timezone);
  return d1.isBefore(d2, "day");
}

/**
 * ¿Es fecha pasada (estrictamente anterior a hoy)?
 */
export function isPast(utcString: ISODateTime | ISODate, timezone: string = DEFAULT_TIMEZONE): boolean {
  return isBefore(utcString, undefined, timezone);
}

/**
 * ¿Es día hábil en la zona horaria del usuario?
 */
export function isWeekday(date: Date | string, timezone: string = DEFAULT_TIMEZONE): boolean {
  const d = dayjs(date).tz(timezone);
  const day = d.day(); // 0=Dom, 1=Lun, ..., 6=Sáb
  return day >= 1 && day <= 5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utilidades para planes y calendarios
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Día de la semana en zona horaria: 0=domingo, 6=sábado.
 */
export function getDayOfWeek(date: string | number | Date, timezone: string = DEFAULT_TIMEZONE): number {
  return dayjs(date).tz(timezone).day();
}

/**
 * Días que tiene el mes.
 */
export function getDaysInMonth(date: string | number | Date, timezone: string = DEFAULT_TIMEZONE): number {
  return dayjs(date).tz(timezone).daysInMonth();
}

/**
 * Navegación de meses.
 */
export function addMonths(date: string | number | Date, amount: number, timezone: string = DEFAULT_TIMEZONE): Date {
  return dayjs(date).tz(timezone).add(amount, "month").toDate();
}

export function subtractMonths(
  date: string | number | Date,
  amount: number,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  return dayjs(date).tz(timezone).subtract(amount, "month").toDate();
}

/**
 * ¿Mismo mes/año?
 */
export function isSameMonth(
  date1: string | number | Date,
  date2: string | number | Date,
  timezone: string = DEFAULT_TIMEZONE,
): boolean {
  return dayjs(date1).tz(timezone).isSame(dayjs(date2).tz(timezone), "month");
}

/**
 * Array de fechas YYYY-MM-DD para un mes completo.
 */
export function getMonthDays(date: string | number | Date, timezone: string = DEFAULT_TIMEZONE): string[] {
  const start = dayjs(date).tz(timezone).startOf("month");
  const days = start.daysInMonth();
  return Array.from({ length: days }, (_, i) => start.add(i, "day").format("YYYY-MM-DD"));
}

/**
 * Paginación: rango de fechas para una página de N días.
 */
export function getPageDates(
  startDate: string,
  pageSize: number,
  page: number,
  timezone: string = DEFAULT_TIMEZONE,
): { start: string; end: string; dates: string[] } {
  const start = dayjs(startDate)
    .tz(timezone)
    .add(page * pageSize, "day");
  const dates: string[] = [];
  for (let i = 0; i < pageSize; i++) {
    dates.push(start.add(i, "day").format("YYYY-MM-DD"));
  }
  return { start: dates[0], end: dates[dates.length - 1], dates };
}

/**
 * Total de páginas para un rango de fechas.
 */
export function getTotalPages(
  startDate: string,
  endDate: string,
  pageSize: number,
  timezone: string = DEFAULT_TIMEZONE,
): number {
  const start = dayjs(startDate).tz(timezone);
  const end = dayjs(endDate).tz(timezone);
  const diff = end.diff(start, "day") + 1;
  return Math.ceil(diff / pageSize);
}

/**
 * Cuenta días hábiles entre dos fechas UTC (inclusive).
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
 * Cuenta días personalizados entre dos fechas UTC (inclusive).
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

/**
 * Días hábiles restantes entre dos fechas en zona horaria.
 */
export function getWorkingDaysRemaining(
  from: Date | string,
  to: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
): number {
  const start = dayjs(from).tz(timezone);
  const end = dayjs(to).tz(timezone);
  let count = 0;
  let current = start.clone();

  while (current.isSameOrBefore(end, "day")) {
    const day = current.day();
    if (day >= 1 && day <= 5) count++;
    current = current.add(1, "day");
  }
  return count;
}

/**
 * Días personalizados restantes entre dos fechas en zona horaria.
 */
export function getCustomDaysRemaining(
  from: Date | string,
  to: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
  customDays: number[],
): number {
  const start = dayjs(from).tz(timezone);
  const end = dayjs(to).tz(timezone);
  let count = 0;
  let current = start.clone();

  while (current.isSameOrBefore(end, "day")) {
    if (customDays.includes(current.day())) count++;
    current = current.add(1, "day");
  }
  return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Conversión a/from Date nativo
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convierte string ISO a Date nativo respetando zona horaria.
 */
export function parseISO(value: string, timezone: string = DEFAULT_TIMEZONE): Date {
  if (!value) return dayjs().tz(timezone).toDate();
  return dayjs(value).tz(timezone).toDate();
}

/**
 * Fecha de hoy como string YYYY-MM-DD en zona horaria.
 */
export function todayISO(timezone: string = DEFAULT_TIMEZONE): ISODate {
  return dayjs().tz(timezone).format("YYYY-MM-DD");
}

/**
 * Obtiene un objeto dayjs en la zona horaria del usuario (útil si algo necesita dayjs directo).
 */
export function getTodayInUserTimezone(timezone: string = DEFAULT_TIMEZONE): dayjs.Dayjs {
  return dayjs().tz(timezone);
}

/**
 * Formato ISO simple: YYYY-MM-DD desde cualquier input.
 */
export function formatISO(date: string | number | Date, timezone: string = DEFAULT_TIMEZONE): ISODate {
  return dayjs(date).tz(timezone).format("YYYY-MM-DD");
}

/**
 * Calcula la fecha final en base a un número de meses desde la fecha actual.
 * @param months Número de meses a sumar
 * @returns Fecha final en formato YYYY-MM-DD
 */
export function getEndDateFromMonths(months: number): ISODate {
  return dayjs.utc(`${todayUTC()}T00:00:00.000Z`).add(months, "month").format("YYYY-MM-DD");
}

/**
 * Convierte string ISO a Date nativo en UTC.
 */
export function parseDateUTC(iso: ISODate): Date {
  return dayjs.utc(iso).toDate(); // Date en UTC
}

/**
 * Calcula la fecha anterior en base a un número de meses desde la fecha actual.
 * @param iso Fecha inicial en formato YYYY-MM-DD
 * @param months Número de meses a restar
 * @returns Fecha anterior en formato YYYY-MM-DD
 */
export function subtractMonthsUTC(iso: ISODate, months: number): ISODate {
  return dayjs.utc(`${iso}T00:00:00.000Z`).subtract(months, "month").format("YYYY-MM-DD");
}
