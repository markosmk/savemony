import { SparklesIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";

export function CelebrationScreen({
  title,
  amount,
  onClose,
}: {
  title?: string;
  amount?: string;
  onClose: () => void;
}) {
  if (!title && !amount) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      >
        {/* Confetti particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="celebration-particle absolute rounded-full"
              style={{
                width: 6 + Math.random() * 8,
                height: 6 + Math.random() * 8,
                backgroundColor: ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#f472b6", "#fb923c", "#a78bfa"][
                  Math.floor(Math.random() * 7)
                ],
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative mx-4 max-w-sm rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-2xl"
        >
          <h2 className="mb-2 text-2xl font-extrabold gradient-text-emerald">¡Tu plan está listo!</h2>
          <p className="mb-1 text-lg font-semibold text-foreground">{title}</p>
          <p className="mb-1 text-sm text-muted-foreground">Meta: {amount}</p>
          <p className="mb-6 text-sm italic text-primary/80">"¡El primer paso es el más importante! 🚀"</p>
          <Button type="button" onClick={onClose} size="lg" className="w-full gap-2 shadow-lg shadow-primary/25">
            <SparklesIcon className="size-4" />
            Ver mi Plan
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
