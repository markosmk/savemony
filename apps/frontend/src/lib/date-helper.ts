import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";

// Extend dayjs with required plugins once.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("es");

// Default timezone for the app. In the future this can be pulled from user settings.
const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

/**
 * Returns a formatted date/time string (e.g. "05/06/2026 15:38").
 * Accepts an optional timezone so callers can override it later.
 */
export function formatDateTime(date: string | number | Date, tz: string = DEFAULT_TIMEZONE): string {
  return dayjs(date).tz(tz).format("DD/MM/YYYY HH:mm");
}

export function formatDate(
  date: string | number | Date,
  // default: "miércoles, 1 de julio de 2026, 12:49 p. m."
  format: string = "dddd, D [de] MMMM [de] YYYY, h:mm a",
): string {
  // TODO: get current tz.. from store or user automatically
  const tz = DEFAULT_TIMEZONE;
  return dayjs(date).tz(tz).format(format);

  // new Date(sale.createdAt).toLocaleString("es-AR", {
  //                       weekday: "long",
  //                       day: "numeric",
  //                       month: "long",
  //                       year: "numeric",
  //                       hour: "2-digit",
  //                       minute: "2-digit",
  //                     }
}

/**
 * Returns just the time portion (e.g. "15:38").
 */
export function formatTime(date: string | number | Date, tz: string = DEFAULT_TIMEZONE): string {
  return dayjs(date).tz(tz).format("HH:mm");
}

/**
 * Returns a human-friendly relative string such as:
 * - "menos de 1 minuto" (when < 60s)
 * - "en 12 minutos"
 * - "hace 2 horas" (if the date is in the past)
 */
export function getRelativeTime(date: string | number | Date, tz: string = DEFAULT_TIMEZONE): string {
  const target = dayjs(date).tz(tz);
  const now = dayjs().tz(tz);
  const diffSeconds = target.diff(now, "second");

  if (diffSeconds < 0) {
    return `hace ${target.fromNow(true)}`;
  }

  if (diffSeconds < 60) {
    return "menos de 1 minuto";
  }

  return `en ${target.fromNow(true)}`;
}

/**
 * Checks whether the given date is still in the future.
 */
export function isFuture(date: string | number | Date, tz: string = DEFAULT_TIMEZONE): boolean {
  return dayjs(date).tz(tz).isAfter(dayjs().tz(tz));
}

/**
 * Returns the application's default timezone.
 * Useful when you need to pass the value explicitly to other helpers.
 */
export function getDefaultTimezone(): string {
  return DEFAULT_TIMEZONE;
}
