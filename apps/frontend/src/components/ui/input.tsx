import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

function InputPassword(props: Omit<React.ComponentProps<"input">, "type">) {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-9" />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-1 top-1 size-8 text-muted-foreground transition-all hover:text-foreground hover:bg-accent rounded-sm flex items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0.5"
      >
        {showPassword ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export { Input, InputPassword };
