import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "size-4 border-2",
  md: "size-8 border-4",
  lg: "size-12 border-6",
};

interface Props extends React.ComponentProps<"div"> {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SpinnerLoader({ message, size = "md", className, children, ...props }: Props) {
  return (
    <div
      className={cn("w-full h-full bg-background min-h-72 flex flex-col gap-2 items-center justify-center", className)}
      {...props}
    >
      <SpinnerIcon size={size} className="border-primary/30 border-t-primary" />
      {message && <h3 className="font-medium text-muted-foreground text-sm">{message}</h3>}
      {children && children}
    </div>
  );
}

export function SpinnerIcon({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div
      className={cn(
        "shrink-0 border-foreground/30 border-t-foreground rounded-full animate-spin",
        sizeClass[size],
        className,
      )}
    />
  );
}
