import { CheckIcon } from "lucide-react";
import { motion } from "motion/react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface IndicatorStepperProps {
  goToStep: (index: number) => void;
  currentStep: number;
  steps: { title: string; icon: React.ComponentType<SVGAElement> | unknown }[];
}

export function IndicatorStepper({ goToStep, currentStep, steps }: IndicatorStepperProps) {
  return (
    <>
      <div className="relative my-4">
        {/* Background Track Line */}
        <div className="absolute top-5 left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] h-[2px] bg-muted -translate-y-1/2 z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute top-5 left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-300 origin-left"
          style={{
            transform: `scaleX(${currentStep === 0 ? 0 : currentStep === 1 ? 0.5 : 1})`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          {steps.map((s, i) => {
            const StepIcon = s.icon as any;
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={s.title} className="flex flex-col items-center gap-1.5 flex-1 text-center">
                {/* Step circle */}
                <motion.button
                  type="button"
                  whileHover={isCompleted ? { scale: 1.1 } : { scale: 1.05 }}
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => isCompleted && goToStep(i)}
                  title={isCompleted ? `Ir a: ${s.title}` : s.title}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all text-sm font-semibold relative mx-auto bg-background border-2",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/10 step-indicator-active cursor-default",
                    !isCompleted && !isCurrent && "border-muted bg-background text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  {/* Glowing dot for current step */}
                  {isCurrent && (
                    <motion.div
                      layoutId="step-dot"
                      className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </motion.button>
                <span
                  className={cn(
                    "text-xs font-semibold hidden sm:block transition-colors mt-0.5",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground/75" : "text-muted-foreground/60",
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Progress value={((currentStep + 1) / 3) * 100} className="mt-4 h-1.5" />
    </>
  );
}
