/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation > */
import type React from "react";
import { useRef, useState } from "react";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

import { formatCents, parseStringToCents } from "@/lib/currency-helper";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";

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

export function CurrencyMultipleInput({
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
