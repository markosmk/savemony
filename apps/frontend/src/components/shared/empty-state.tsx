/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation > */
"use client";

import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: "savings" | "achievements" | "timeline" | "search";
}

// ─── SVG Illustrations ───

function SavingsIllustration() {
  return (
    <motion.svg
      viewBox="0 0 200 160"
      className="mx-auto h-36 w-44"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Piggy bank body */}
      <motion.ellipse
        cx="100"
        cy="95"
        rx="60"
        ry="45"
        fill="oklch(0.82 0.15 162)"
        stroke="oklch(0.65 0.15 162)"
        strokeWidth="2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      {/* Snout */}
      <ellipse cx="155" cy="95" rx="14" ry="10" fill="oklch(0.75 0.14 162)" />
      <circle cx="150" cy="93" r="2" fill="oklch(0.4 0.06 162)" />
      <circle cx="160" cy="93" r="2" fill="oklch(0.4 0.06 162)" />
      {/* Ear */}
      <ellipse cx="70" cy="58" rx="12" ry="16" fill="oklch(0.72 0.14 162)" transform="rotate(-15 70 58)" />
      <ellipse cx="70" cy="60" rx="7" ry="10" fill="oklch(0.85 0.12 162)" transform="rotate(-15 70 60)" />
      {/* Eye */}
      <circle cx="118" cy="78" r="5" fill="oklch(0.25 0.02 155)" />
      <circle cx="119.5" cy="77" r="1.5" fill="white" />
      {/* Legs */}
      <rect x="70" y="130" width="12" height="16" rx="6" fill="oklch(0.65 0.15 162)" />
      <rect x="90" y="132" width="12" height="16" rx="6" fill="oklch(0.65 0.15 162)" />
      <rect x="110" y="132" width="12" height="16" rx="6" fill="oklch(0.65 0.15 162)" />
      <rect x="130" y="130" width="12" height="16" rx="6" fill="oklch(0.65 0.15 162)" />
      {/* Coin slot */}
      <rect x="90" y="52" width="20" height="4" rx="2" fill="oklch(0.4 0.06 162)" />
      {/* Floating coins */}
      {[
        { cx: 45, cy: 35, delay: 0, size: 14 },
        { cx: 155, cy: 40, delay: 0.3, size: 12 },
        { cx: 80, cy: 20, delay: 0.6, size: 10 },
        { cx: 130, cy: 25, delay: 0.9, size: 11 },
        { cx: 105, cy: 12, delay: 1.2, size: 9 },
      ].map((coin, i) => (
        <motion.g
          key={i}
          initial={{ y: 10, opacity: 0 }}
          animate={{
            y: [0, -6, 0],
            opacity: [0, 1, 1],
          }}
          transition={{
            y: { duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5, delay: coin.delay },
          }}
        >
          <circle
            cx={coin.cx}
            cy={coin.cy}
            r={coin.size}
            fill="oklch(0.83 0.19 84)"
            stroke="oklch(0.77 0.19 70)"
            strokeWidth="1.5"
          />
          <text
            x={coin.cx}
            y={coin.cy + coin.size * 0.35}
            textAnchor="middle"
            fill="oklch(0.55 0.14 70)"
            fontSize={coin.size * 0.9}
            fontWeight="bold"
          >
            $
          </text>
        </motion.g>
      ))}
      {/* Tail */}
      <motion.path
        d="M 40 85 Q 25 80 30 65 Q 35 55 42 60"
        fill="none"
        stroke="oklch(0.65 0.15 162)"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "40px 85px" }}
      />
    </motion.svg>
  );
}

function AchievementsIllustration() {
  return (
    <motion.svg
      viewBox="0 0 200 160"
      className="mx-auto h-36 w-44"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Trophy cup */}
      <motion.g
        initial={{ scale: 0.5, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Cup body */}
        <path
          d="M 65 40 L 70 100 Q 70 110 100 110 Q 130 110 130 100 L 135 40 Z"
          fill="oklch(0.83 0.19 84)"
          stroke="oklch(0.77 0.19 70)"
          strokeWidth="2"
        />
        {/* Cup left handle */}
        <path
          d="M 65 50 Q 40 50 40 70 Q 40 90 60 90"
          fill="none"
          stroke="oklch(0.83 0.19 84)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Cup right handle */}
        <path
          d="M 135 50 Q 160 50 160 70 Q 160 90 140 90"
          fill="none"
          stroke="oklch(0.83 0.19 84)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Stem */}
        <rect x="95" y="110" width="10" height="18" fill="oklch(0.77 0.19 70)" />
        {/* Base */}
        <ellipse
          cx="100"
          cy="132"
          rx="28"
          ry="8"
          fill="oklch(0.83 0.19 84)"
          stroke="oklch(0.77 0.19 70)"
          strokeWidth="1.5"
        />
        {/* Shine on cup */}
        <path
          d="M 78 55 L 80 90 Q 80 92 82 92"
          fill="none"
          stroke="oklch(0.95 0.05 84)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Star on cup */}
        <text x="100" y="82" textAnchor="middle" fontSize="22" fill="oklch(0.95 0.03 84)">
          ★
        </text>
      </motion.g>
      {/* Floating stars */}
      {[
        { cx: 35, cy: 30, delay: 0, size: 8 },
        { cx: 170, cy: 25, delay: 0.4, size: 6 },
        { cx: 25, cy: 70, delay: 0.8, size: 5 },
        { cx: 180, cy: 65, delay: 1.2, size: 7 },
        { cx: 55, cy: 15, delay: 0.6, size: 5 },
        { cx: 150, cy: 50, delay: 1.0, size: 4 },
      ].map((star, i) => (
        <motion.text
          key={i}
          x={star.cx}
          y={star.cy}
          textAnchor="middle"
          fontSize={star.size * 3}
          fill="oklch(0.83 0.19 84)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            y: [0, -4, 0],
            opacity: [0, 0.8, 0.8],
            scale: [0, 1, 1],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            y: { duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.4, delay: star.delay },
            scale: { duration: 0.4, delay: star.delay, type: "spring" },
            rotate: {
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          ✦
        </motion.text>
      ))}
      {/* Sparkle effects */}
      {[
        { cx: 160, cy: 35, delay: 0.2 },
        { cx: 30, cy: 50, delay: 0.7 },
      ].map((spark, i) => (
        <motion.g
          key={`spark-${i}`}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: spark.delay }}
        >
          <line
            x1={spark.cx - 4}
            y1={spark.cy}
            x2={spark.cx + 4}
            y2={spark.cy}
            stroke="oklch(0.83 0.19 84)"
            strokeWidth="1.5"
          />
          <line
            x1={spark.cx}
            y1={spark.cy - 4}
            x2={spark.cx}
            y2={spark.cy + 4}
            stroke="oklch(0.83 0.19 84)"
            strokeWidth="1.5"
          />
        </motion.g>
      ))}
    </motion.svg>
  );
}

function TimelineIllustration() {
  return (
    <motion.svg
      viewBox="0 0 200 160"
      className="mx-auto h-36 w-44"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Winding path */}
      <motion.path
        d="M 30 130 Q 30 90 60 90 Q 90 90 90 60 Q 90 30 120 30 Q 150 30 150 60 Q 150 90 170 90 Q 185 90 185 105"
        fill="none"
        stroke="oklch(0.75 0.15 162)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="500"
        strokeDashoffset="500"
        initial={{ strokeDashoffset: 500 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      {/* Path dots */}
      {[
        { cx: 30, cy: 130, delay: 0, filled: true },
        { cx: 60, cy: 90, delay: 0.3, filled: true },
        { cx: 90, cy: 60, delay: 0.6, filled: true },
        { cx: 120, cy: 30, delay: 0.9, filled: false },
        { cx: 150, cy: 60, delay: 1.2, filled: false },
        { cx: 170, cy: 90, delay: 1.5, filled: false },
        { cx: 185, cy: 105, delay: 1.8, filled: false },
      ].map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.filled ? 6 : 5}
          fill={dot.filled ? "oklch(0.696 0.17 162)" : "white"}
          stroke={dot.filled ? "oklch(0.596 0.145 163)" : "oklch(0.75 0.15 162)"}
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: dot.filled ? [1, 1.15, 1] : 1,
            opacity: 1,
          }}
          transition={{
            scale: dot.filled
              ? {
                  duration: 0.5,
                  delay: dot.delay + 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }
              : { duration: 0.3, delay: dot.delay + 0.5 },
            opacity: { duration: 0.3, delay: dot.delay + 0.5 },
          }}
        />
      ))}
      {/* Check marks on filled dots */}
      {[
        { cx: 30, cy: 130, delay: 0.5 },
        { cx: 60, cy: 90, delay: 0.8 },
        { cx: 90, cy: 60, delay: 1.1 },
      ].map((check, i) => (
        <motion.text
          key={`check-${i}`}
          x={check.cx}
          y={check.cy + 3.5}
          textAnchor="middle"
          fontSize="8"
          fill="white"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: check.delay }}
        >
          ✓
        </motion.text>
      ))}
      {/* Arrow at the end */}
      <motion.polygon
        points="180,115 185,105 190,115"
        fill="oklch(0.75 0.15 162)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 2 }}
      />
    </motion.svg>
  );
}

function SearchIllustration() {
  return (
    <motion.svg
      viewBox="0 0 200 160"
      className="mx-auto h-36 w-44"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.g
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Magnifying glass lens */}
        <motion.circle
          cx="90"
          cy="75"
          r="45"
          fill="oklch(0.96 0.02 155)"
          stroke="oklch(0.696 0.17 162)"
          strokeWidth="4"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "110px 105px" }}
        />
        {/* Lens shine */}
        <path d="M 72 58 Q 68 52 75 50" fill="none" stroke="oklch(0.8 0.1 155)" strokeWidth="3" strokeLinecap="round" />
        {/* Magnifying glass handle */}
        <rect
          x="125"
          y="105"
          width="12"
          height="40"
          rx="6"
          fill="oklch(0.75 0.15 162)"
          stroke="oklch(0.596 0.145 163)"
          strokeWidth="2"
          transform="rotate(40 131 125)"
        />
      </motion.g>
      {/* Floating question marks */}
      {[
        { x: 35, y: 40, delay: 0 },
        { x: 165, y: 50, delay: 0.5 },
        { x: 55, y: 130, delay: 1.0 },
      ].map((q, i) => (
        <motion.text
          key={i}
          x={q.x}
          y={q.y}
          textAnchor="middle"
          fontSize="18"
          fill="oklch(0.7 0.1 162)"
          initial={{ opacity: 0 }}
          animate={{
            y: [0, -5, 0],
            opacity: [0, 0.5, 0.5],
          }}
          transition={{
            y: { duration: 2.5 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.4, delay: q.delay },
          }}
        >
          ?
        </motion.text>
      ))}
    </motion.svg>
  );
}

const ILLUSTRATIONS = {
  savings: SavingsIllustration,
  achievements: AchievementsIllustration,
  timeline: TimelineIllustration,
  search: SearchIllustration,
};

export function EmptyState({ emoji, title, description, actionLabel, onAction, illustration }: EmptyStateProps) {
  const IllustrationComponent = illustration ? ILLUSTRATIONS[illustration] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center px-4 py-6 text-center"
    >
      {/* Illustration or emoji */}
      {IllustrationComponent ? (
        <div className="mb-4">
          <IllustrationComponent />
        </div>
      ) : emoji ? (
        <div className="relative mb-6">
          <div className="flex size-28 items-center justify-center rounded-3xl bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5">
            <span className="text-5xl">{emoji}</span>
          </div>
        </div>
      ) : null}

      {/* Title with gradient */}
      <h3 className="mb-2 text-lg font-bold gradient-text-emerald sm:text-xl">{title}</h3>

      {/* Description */}
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>

      {/* Action button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="shine-effect gap-2 rounded-xl shadow-lg shadow-primary/20">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
