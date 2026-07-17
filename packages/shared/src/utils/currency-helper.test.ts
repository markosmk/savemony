import { describe, expect, it } from "vitest";

import { formatAmount, formatCurrency, getCurrencySymbol, parseCurrencyInput, roundUp } from "./currency-helpers";

describe("formatAmount", () => {
  it("formatea pesos chilenos", () => {
    expect(formatAmount(100_000, "es-CL")).toBe("$100.000");
    expect(formatAmount(1_500_000, "es-CL")).toBe("$1.500.000");
  });

  it("formatea pesos argentinos", () => {
    expect(formatAmount(100_000, "es-AR")).toBe("$100.000");
  });

  it("formatea con decimales para otros locales", () => {
    const result = formatAmount(100.5, "en-US");
    expect(result).toContain("$");
    expect(result).toContain("100.50");
  });

  it("monto 0", () => {
    expect(formatAmount(0, "es-CL")).toBe("$0");
  });
});

describe("formatCurrency", () => {
  it("convierte centavos a pesos chilenos", () => {
    expect(formatCurrency(10_000, "es-CL")).toBe("$100"); // 10.000 centavos = $100
  });

  it("convierte centavos a pesos argentinos", () => {
    expect(formatCurrency(100_000, "es-AR")).toBe("$1.000"); // 100.000 centavos = $1.000
  });
});

describe("parseCurrencyInput", () => {
  it("parsea número simple", () => {
    expect(parseCurrencyInput("10000")).toBe(10_000);
  });

  it("parsea con símbolo de moneda", () => {
    expect(parseCurrencyInput("$10.000")).toBe(10_000);
  });

  it("parsea con puntos de miles", () => {
    expect(parseCurrencyInput("1.000.000")).toBe(1_000_000);
  });

  it("parsea con espacios", () => {
    expect(parseCurrencyInput("10 000")).toBe(10_000);
  });

  it("convierte decimales a centavos", () => {
    expect(parseCurrencyInput("100.50")).toBe(10_050); // 100.50 → 10050 centavos
  });

  it("convierte coma decimal a centavos", () => {
    expect(parseCurrencyInput("100,50")).toBe(10_050);
  });

  it("input inválido devuelve null", () => {
    expect(parseCurrencyInput("abc")).toBeNull();
  });

  it("número negativo devuelve null", () => {
    expect(parseCurrencyInput("-1000")).toBeNull();
  });

  it("input vacío devuelve null", () => {
    expect(parseCurrencyInput("")).toBeNull();
  });

  it("input solo espacios devuelve null", () => {
    expect(parseCurrencyInput("   ")).toBeNull();
  });
});

describe("roundUp", () => {
  it("redondea al alza a 1000", () => {
    expect(roundUp(115_400, 1000)).toBe(116_000);
  });

  it("número exacto no cambia", () => {
    expect(roundUp(100_000, 1000)).toBe(100_000);
  });

  it("redondea al alza a 100", () => {
    expect(roundUp(115_450, 100)).toBe(115_500);
  });

  it("número menor que el múltiplo", () => {
    expect(roundUp(500, 1000)).toBe(1000);
  });

  it("0 se queda en 0", () => {
    expect(roundUp(0, 1000)).toBe(0);
  });
});

describe("getCurrencySymbol", () => {
  it("pesos chilenos → $", () => {
    expect(getCurrencySymbol("es-CL")).toBe("$");
  });

  it("euros → €", () => {
    expect(getCurrencySymbol("es-ES")).toBe("€");
  });

  it("dólares → $", () => {
    expect(getCurrencySymbol("en-US")).toBe("$");
  });

  it("locale desconocido → $ por defecto", () => {
    expect(getCurrencySymbol("xx-XX")).toBe("$");
  });
});
