/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation > */
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type ConfigCurrency, CURRENCIES } from "@savemony/shared";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";

// ==========================================
// 1. HELPERS MATEMÁTICOS (Para lógica de negocio y DB)
// ==========================================

/**
 * Convierte un string ("15.50", "15,50") a centavos de forma segura.
 * para evitar los errores de punto flotante de JavaScript
 */
export const parseStringToCents = (amountStr: string): number => {
  if (!amountStr) return 0;

  // 1. Reemplazamos comas por puntos por si el usuario usa coma decimal
  // 2. Quitamos cualquier caracter que no sea número, punto o guion
  const cleanStr = amountStr.replace(",", ".").replace(/[^0-9.-]/g, "");

  const parsed = parseFloat(cleanStr);
  if (Number.isNaN(parsed)) return 0;

  // Math.round es crucial aquí para evitar que 15.50 * 100 termine en 1550.0000000001
  return Math.round(parsed * 100);
};

/** Convierte pesos/dólares a centavos de forma segura (evitando errores de punto flotante en JS) */
export const toCents = (value: number): number => Math.round(value * 100);

/** Convierte centavos a la unidad principal */
export const fromCents = (value: number): number => value / 100;

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number; // El valor siempre entra en centavos
  onChange: (cents: number) => void; // Emitimos siempre en centavos
  withCents?: boolean;
}

// ==========================================
// 2. FORMATEADORES (Para la UI / Capa de Presentación)
// ==========================================

/**
 * Formatea una cantidad en unidad principal (ej: 150 pesos) a su representación local.
 */
export function formatCurrency(amount: number, opts: ConfigCurrency = {}): string {
  // 1. Normalizamos los valores por defecto de manera segura
  const currencyCode = (opts.currency ?? "USD").toUpperCase();
  // const value = opts.isCents ? amount / 100 : amount;

  // 2. Buscamos si tenemos guardado un locale sugerido para esa moneda
  const knownCurrency = CURRENCIES.find((c) => c.code === currencyCode);

  // Si el usuario no envía un locale, usamos el de la moneda conocida.
  // Si la moneda no está en nuestra lista, pasamos 'undefined' para que Intl use el idioma del navegador del usuario.
  const resolvedLocale = opts.locale ?? knownCurrency?.locale;

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: opts.displayType ?? "symbol",
      // Si el usuario define 'fractionDigits', lo usamos.
      // Si no, dejamos que Intl decida el estándar de la moneda de forma nativa.
      minimumFractionDigits: opts.fractionDigits,
      maximumFractionDigits: opts.fractionDigits,
    }).format(amount);
  } catch (_error) {
    // Plan de rescate (Fallback) en caso de que el navegador falle o el código de moneda no sea válido
    const fallbackSymbol = knownCurrency?.symbol ?? "$";
    const formattedValue = amount.toLocaleString(resolvedLocale, {
      minimumFractionDigits: opts.fractionDigits ?? 2,
      maximumFractionDigits: opts.fractionDigits ?? 2,
    });
    return `${fallbackSymbol}${formattedValue}`;
  }
}
/**
 * EL WRAPPER: Formatea centavos directamente (ej: 15000 centavos) a moneda local.
 * Ideal para renderizar datos que vienen directamente de tu base de datos.
 */
export function formatCents(centsAmount: number, opts: ConfigCurrency = {}): string {
  const valueInMainUnit = fromCents(centsAmount);
  return formatCurrency(valueInMainUnit, opts);
}

/***
 * METHODS
 */

/**
 * Componente para monedas que recibe centavos y emite centavos,
 * pero internamente maneja el texto para darle una experiencia fluida al usuario.
 * @param value Valor en centavos
 * @param onChange Callback que recibe el valor en centavos
 * @param props Props adicionales
 * @returns
 */
function CurrencyInput({ value, onChange, withCents, ...props }: CurrencyInputProps) {
  // Estado local en STRING para permitir al usuario escribir decimales libremente
  const [inputValue, setInputValue] = useState<string>("");

  // Sincronizar el valor externo (centavos) con el texto interno inicial
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation - evita ciclo infinito>
  useEffect(() => {
    // Solo actualizamos si el valor externo no coincide con lo que está escrito,
    // para evitar que el cursor salte mientras el usuario escribe.
    const currentCents = parseStringToCents(inputValue);
    if (value !== currentCents) {
      // Si value es 0 y el input está vacío, no pongas un "0" en pantalla de golpe
      if (value === 0 && inputValue === "") return;

      setInputValue(value === 0 ? "" : fromCents(value).toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Permitir solo números y un único separador decimal (punto o coma)
    const regex = /^[0-9]*[.,]?[0-9]*$/;
    if (rawValue === "" || regex.test(rawValue)) {
      setInputValue(rawValue);

      // Emitimos el cambio en centavos hacia arriba
      onChange(parseStringToCents(rawValue));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al salir del input, formateamos el número para que quede limpio
    // (ej: si dejó "15.", lo cambiamos a "15")
    const cents = parseStringToCents(inputValue);
    setInputValue(cents === 0 ? "" : fromCents(cents).toString());

    // Ejecutar la función onBlur original si fue pasada en los props
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
      <Input
        type="text"
        inputMode="decimal" // Levanta el teclado numérico en celulares
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        className="pl-7" // Espacio para el símbolo de moneda
        {...props}
      />
    </div>
  );
}

interface CurrencyMultipleInputProps {
  /**  Array de centavos [10000, 12000, 15000] */
  value: number[];
  onChange: (value: number[]) => void;
  /** Opcional: Array de centavos para botones rápidos (ej: [500000, 1000000]) */
  presets?: number[];
  currency?: string;
  locale?: string;
  placeholder?: string;
}

function CurrencyMultipleInput({
  value = [],
  onChange,
  presets = [],
  currency = "CLP",
  locale = "es-CL",
  placeholder = "Escribe un monto y presiona Enter...",
}: CurrencyMultipleInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Al usar onMouseDown prevenimos que el click robe el foco del input
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si hicieron clic directamente en el contenedor o el espacio vacío, enfocamos el input
    if (e.target === e.currentTarget) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  const addValue = (cents: number) => {
    if (cents <= 0) return;
    if (value.includes(cents)) return;

    onChange([...value, cents]);
  };

  const removeValueAtIndex = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Si presiona Enter o Coma, agregamos el tag
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const cents = parseStringToCents(inputValue);
      if (cents > 0) {
        addValue(cents);
        setInputValue("");
      }
    }

    // Si el input está vacío y presiona borrar, quitamos el último tag
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      e.preventDefault();
      removeValueAtIndex(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const regex = /^[0-9]*[.,]?[0-9]*$/; // allow decimal
    if (val === "" || regex.test(val)) {
      setInputValue(val);
    }
  };

  return (
    <div className="space-y-2.5">
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "flex w-full flex-wrap gap-1.5",
          "min-h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          "cursor-text focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring",
        )}
      >
        {value.map((cents, index) => (
          <Badge key={`${cents}-${index}`} variant="secondary" className="flex items-center gap-1 pl-2.5 pr-1 py-0.5">
            {formatCents(cents, { currency, locale })}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeValueAtIndex(index);
              }}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}

        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground min-w-[120px]"
          onFocus={(e) => e.target.select()}
        />
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium mr-1">Rápidos:</span>
          {presets.map((presetCents) => {
            const isAlreadySelected = value.includes(presetCents);

            return (
              <Button
                key={presetCents}
                type="button"
                variant={isAlreadySelected ? "secondary" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs py-1 rounded-full font-normal"
                disabled={isAlreadySelected}
                onClick={() => addValue(presetCents)}
              >
                {isAlreadySelected ? (
                  <>
                    <CheckIcon className="size-3 text-emerald-500" />
                    {formatCents(presetCents, { currency, locale })}
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-3" /> {formatCents(presetCents, { currency, locale })}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { CurrencyInput, CurrencyMultipleInput };
