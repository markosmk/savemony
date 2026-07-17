import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDaysUTC,
  countCustomDays,
  countWeekdays,
  diffInDaysUTC,
  endOfMonthUTC,
  endOfWeekUTC,
  getDayOfWeekUTC,
  getDaysInMonthUTC,
  getEndDateFromMonths,
  isTodayOrBefore,
  isWeekdayUTC,
  nowUTC,
  parseDateUTC,
  startOfMonthUTC,
  startOfWeekUTC,
  subtractMonthsUTC,
  todayUTC,
} from "./date-helpers";

// todayUTC / nowUTC

describe("todayUTC", () => {
  it("devuelve fecha en formato YYYY-MM-DD", () => {
    const today = todayUTC();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("devuelve fecha consistente con nowUTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));

    expect(todayUTC()).toBe("2026-07-15");
    expect(nowUTC().startsWith("2026-07-15")).toBe(true);

    vi.useRealTimers();
  });
});

describe("addDaysUTC", () => {
  it("suma días", () => {
    expect(addDaysUTC("2026-07-15", 1)).toBe("2026-07-16");
    expect(addDaysUTC("2026-07-15", 10)).toBe("2026-07-25");
  });

  it("resta días", () => {
    expect(addDaysUTC("2026-07-15", -1)).toBe("2026-07-14");
    expect(addDaysUTC("2026-07-15", -15)).toBe("2026-06-30");
  });

  it("cambia de mes", () => {
    expect(addDaysUTC("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysUTC("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("cambia de año", () => {
    expect(addDaysUTC("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysUTC("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("año bisiesto: febrero tiene 29 días", () => {
    expect(addDaysUTC("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDaysUTC("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("año no bisiesto: febrero tiene 28 días", () => {
    expect(addDaysUTC("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("diffInDaysUTC", () => {
  it("misma fecha = 0", () => {
    expect(diffInDaysUTC("2026-07-15", "2026-07-15")).toBe(0);
  });

  it("diferencia positiva", () => {
    expect(diffInDaysUTC("2026-07-15", "2026-07-20")).toBe(5);
  });

  it("diferencia negativa", () => {
    expect(diffInDaysUTC("2026-07-20", "2026-07-15")).toBe(-5);
  });

  it("cambio de mes", () => {
    expect(diffInDaysUTC("2026-07-31", "2026-08-01")).toBe(1);
  });

  it("cambio de año", () => {
    expect(diffInDaysUTC("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("getDayOfWeekUTC", () => {
  it("2026-07-12 es Domingo (0)", () => {
    expect(getDayOfWeekUTC("2026-07-12")).toBe(0);
  });

  it("2026-07-13 es Lunes (1)", () => {
    expect(getDayOfWeekUTC("2026-07-13")).toBe(1);
  });

  it("2026-07-15 es Miércoles (3)", () => {
    expect(getDayOfWeekUTC("2026-07-15")).toBe(3);
  });

  it("2026-07-18 es Sábado (6)", () => {
    expect(getDayOfWeekUTC("2026-07-18")).toBe(6);
  });

  it("2026-07-19 es Domingo (0)", () => {
    expect(getDayOfWeekUTC("2026-07-19")).toBe(0);
  });
});

describe("startOfWeekUTC", () => {
  it("Miércoles → Lunes de esa semana", () => {
    expect(startOfWeekUTC("2026-07-15")).toBe("2026-07-13");
  });

  it("Domingo → Lunes de esa semana", () => {
    expect(startOfWeekUTC("2026-07-12")).toBe("2026-07-06");
  });

  it("Lunes → mismo Lunes", () => {
    expect(startOfWeekUTC("2026-07-13")).toBe("2026-07-13");
  });
});

describe("endOfWeekUTC", () => {
  it("Miércoles → Domingo de esa semana", () => {
    expect(endOfWeekUTC("2026-07-15")).toBe("2026-07-19");
  });

  it("Domingo → mismo Domingo", () => {
    expect(endOfWeekUTC("2026-07-12")).toBe("2026-07-12");
  });

  it("Lunes → Domingo de esa semana", () => {
    expect(endOfWeekUTC("2026-07-13")).toBe("2026-07-19");
  });
});

describe("startOfMonthUTC", () => {
  it("cualquier día del mes → primer día", () => {
    expect(startOfMonthUTC("2026-07-15")).toBe("2026-07-01");
    expect(startOfMonthUTC("2026-12-31")).toBe("2026-12-01");
  });
});

describe("endOfMonthUTC", () => {
  it("julio → 31", () => {
    expect(endOfMonthUTC("2026-07-15")).toBe("2026-07-31");
  });

  it("febrero no bisiesto → 28", () => {
    expect(endOfMonthUTC("2026-02-15")).toBe("2026-02-28");
  });

  it("febrero bisiesto → 29", () => {
    expect(endOfMonthUTC("2024-02-15")).toBe("2024-02-29");
  });

  it("abril → 30", () => {
    expect(endOfMonthUTC("2026-04-15")).toBe("2026-04-30");
  });
});

describe("isWeekdayUTC", () => {
  it("Lunes → true", () => {
    expect(isWeekdayUTC("2026-07-13")).toBe(true);
  });

  it("Viernes → true", () => {
    expect(isWeekdayUTC("2026-07-17")).toBe(true);
  });

  it("Sábado → false", () => {
    expect(isWeekdayUTC("2026-07-18")).toBe(false);
  });

  it("Domingo → false", () => {
    expect(isWeekdayUTC("2026-07-12")).toBe(false);
  });
});

describe("isTodayOrBefore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fecha anterior → true", () => {
    expect(isTodayOrBefore("2026-07-14")).toBe(true);
  });

  it("hoy → true", () => {
    expect(isTodayOrBefore("2026-07-15")).toBe(true);
  });

  it("fecha futura → false", () => {
    expect(isTodayOrBefore("2026-07-16")).toBe(false);
  });
});

describe("getDaysInMonthUTC", () => {
  it("enero → 31", () => {
    expect(getDaysInMonthUTC(2026, 1)).toBe(31);
  });

  it("febrero no bisiesto → 28", () => {
    expect(getDaysInMonthUTC(2026, 2)).toBe(28);
  });

  it("febrero bisiesto → 29", () => {
    expect(getDaysInMonthUTC(2024, 2)).toBe(29);
  });

  it("abril → 30", () => {
    expect(getDaysInMonthUTC(2026, 4)).toBe(30);
  });

  it("julio → 31", () => {
    expect(getDaysInMonthUTC(2026, 7)).toBe(31);
  });

  it("diciembre → 31", () => {
    expect(getDaysInMonthUTC(2026, 12)).toBe(31);
  });
});

describe("countWeekdays", () => {
  it("una semana completa → 5 días hábiles", () => {
    expect(countWeekdays("2026-07-13", "2026-07-19")).toBe(5);
  });

  it("solo fines de semana → 0", () => {
    expect(countWeekdays("2026-07-12", "2026-07-12")).toBe(0);
  });

  it("dos semanas → 10 días hábiles", () => {
    expect(countWeekdays("2026-07-13", "2026-07-26")).toBe(10);
  });
});

describe("countCustomDays", () => {
  it("Lunes, Miércoles, Viernes en una semana → 3", () => {
    expect(countCustomDays("2026-07-13", "2026-07-19", [1, 3, 5])).toBe(3);
  });

  it("solo Domingos en una semana → 1", () => {
    expect(countCustomDays("2026-07-13", "2026-07-19", [0])).toBe(1);
  });
});

describe("getEndDateFromMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("6 meses desde julio → enero", () => {
    expect(getEndDateFromMonths(6)).toBe("2027-01-15");
  });

  it("1 mes desde julio → agosto", () => {
    expect(getEndDateFromMonths(1)).toBe("2026-08-15");
  });

  it("12 meses desde julio → julio del año siguiente", () => {
    expect(getEndDateFromMonths(12)).toBe("2027-07-15");
  });
});

describe("subtractMonthsUTC", () => {
  it("resta meses", () => {
    expect(subtractMonthsUTC("2026-07-15", 1)).toBe("2026-06-15");
  });

  it("resta meses cruzando año", () => {
    expect(subtractMonthsUTC("2026-01-15", 1)).toBe("2025-12-15");
  });

  it("resta múltiples meses", () => {
    expect(subtractMonthsUTC("2026-07-15", 6)).toBe("2026-01-15");
  });
});

describe("parseDateUTC", () => {
  it("parsea fecha ISO a Date nativo UTC", () => {
    const date = parseDateUTC("2026-07-15");
    expect(date instanceof Date).toBe(true);
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(6); // 0-indexed: julio = 6
    expect(date.getUTCDate()).toBe(15);
  });
});
