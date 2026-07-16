import type React from "react";

import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface GroupInputProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
}

export const GroupInput: React.FC<GroupInputProps> = ({ value, onValueChange, options }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all duration-200 cursor-pointer min-h-[60px] active:scale-95",
              isSelected
                ? "border-primary bg-primary/30 dark:border-primary/50 dark:bg-primary/50 dark:text-white font-medium ring-2 ring-primary/20"
                : "border bg-muted",
            )}
          >
            <span className="text-sm">{option.label}</span>
            {option.description && (
              <span
                className={`text-xs mt-0.5 ${isSelected ? "text-blue-500 dark:text-blue-200/50" : "text-muted-foreground"}`}
              >
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
