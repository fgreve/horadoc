import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const CHILE_TZ = "America/Santiago";

export function toChileTime(date: Date): Date {
  return toZonedTime(date, CHILE_TZ);
}

export function formatChileDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const chileDate = toChileTime(d);
  return format(chileDate, "EEE d MMM", { locale: es });
}

export function formatChileTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function getNextWeekDates(): Date[] {
  const today = toChileTime(new Date());
  return Array.from({ length: 7 }, (_, i) => addDays(today, i));
}

export function getDayName(date: Date): string {
  const chileDate = toChileTime(date);
  return format(chileDate, "EEEE", { locale: es });
}
