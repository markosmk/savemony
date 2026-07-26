import { useMemo, useState } from "react";
import { type CalendarDay, type Entry, getCalendarMonthData } from "@savemony/shared";

export interface UsePlanCalendarReturn {
  calendarData: CalendarDay[];
  calendarMonth: number;
  calendarYear: number;
  setCalendarMonth: (m: number) => void;
  setCalendarYear: (y: number) => void;
}

export function usePlanCalendar(entries: Entry[]): UsePlanCalendarReturn {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const calendarData = useMemo(
    () => getCalendarMonthData(entries, calendarYear, calendarMonth),
    [entries, calendarYear, calendarMonth],
  );

  return {
    calendarData,
    calendarMonth,
    calendarYear,
    setCalendarMonth,
    setCalendarYear,
  };
}
