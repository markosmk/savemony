import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface InputNumberProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  onChange?: (value: number | undefined) => void;
}

function InputNumber({ onChange, ...props }: InputNumberProps) {
  return (
    <Input
      {...props}
      type="number"
      onChange={(e) => {
        const value = e.target.value;
        onChange?.(value === "" ? undefined : Number(value));
      }}
    />
  );
}

export interface InputNumberProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number | string | undefined;
  onChange?: (value: number | undefined) => void;
  leadingContent?: React.ReactNode;
  trailingContent?: React.ReactNode;
  showSteppers?: boolean;
  step?: string;
  stepperVariant?: "adjacent" | "stacked" | "inline";
}

function InputNumberStepper({
  value,
  onChange,
  leadingContent,
  trailingContent,
  showSteppers = false,
  step = "1",
  stepperVariant = "inline",
  min,
  max,
  className,
  ...props
}: InputNumberProps) {
  const numericValue = typeof value === "string" ? Number(value) : value;

  const handleStep = (direction: 1 | -1) => {
    const current = numericValue ?? 0;
    let next = current + direction * Number(step);

    if (min !== undefined) next = Math.max(next, Number(min));
    if (max !== undefined) next = Math.min(next, Number(max));

    const decimals = step.toString().split(".")[1]?.length || 0;
    next = Number(next.toFixed(decimals));

    onChange?.(next);
  };

  const canIncrement = !(max !== undefined && numericValue !== undefined && numericValue >= Number(max));
  const canDecrement = !(min !== undefined && numericValue !== undefined && numericValue <= Number(min));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "group relative flex items-center w-full rounded-md border border-input bg-transparent",
          // "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
          "has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50",

          "w-full min-w-0 rounded-lg border-2 border-accent bg-input text-base transition-all duration-200 ease-in-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        )}
      >
        {leadingContent && (
          <div
            data-slot="input-leading-content"
            className="shrink-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 border-r border-input rounded-l-md px-3 py-2 select-none"
          >
            {leadingContent}
          </div>
        )}

        <Input
          {...props}
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : Number(e.target.value);
            onChange?.(val);
          }}
          className={cn(
            "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
            "bg-transparent h-full py-2 px-3",
            // "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            // "[&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0",
            // "appearance-none",
          )}
        />

        {trailingContent && (
          <div
            data-slot="input-trailing-content"
            className="shrink-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 border-l border-input rounded-r-md px-3 py-2 select-none"
          >
            {trailingContent}
          </div>
        )}

        {showSteppers && stepperVariant === "inline" && (
          <div className="shrink-0 flex flex-col border-l border-input w-7 mr-0.5">
            <button
              type="button"
              onClick={() => handleStep(1)}
              className="flex-1 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors rounded-tr-sm active:bg-accent/80 disabled:opacity-30"
              disabled={!canIncrement}
              tabIndex={-1}
            >
              <ChevronUpIcon size={11} strokeWidth={2.5} />
            </button>
            <div className="h-px bg-input" />
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="flex-1 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors rounded-br-sm active:bg-accent/80 disabled:opacity-30"
              disabled={!canDecrement}
              tabIndex={-1}
            >
              <ChevronDownIcon size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Steppers adjacent (botones + / - al lado) */}
      {showSteppers && stepperVariant === "adjacent" && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => handleStep(-1)}
            disabled={!canDecrement}
            tabIndex={-1}
          >
            <MinusIcon size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => handleStep(1)}
            disabled={!canIncrement}
            tabIndex={-1}
          >
            <PlusIcon size={14} />
          </Button>
        </>
      )}

      {/* Steppers stacked (apilados, compacto) */}
      {showSteppers && stepperVariant === "stacked" && (
        <div className="flex flex-col gap-0.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-[19px] w-8 shrink-0"
            onClick={() => handleStep(1)}
            disabled={!canIncrement}
            tabIndex={-1}
          >
            <ChevronUpIcon size={12} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-[19px] w-8 shrink-0"
            onClick={() => handleStep(-1)}
            disabled={!canDecrement}
            tabIndex={-1}
          >
            <ChevronDownIcon size={12} />
          </Button>
        </div>
      )}
    </div>
  );
}

export { InputNumber, InputNumberStepper };
