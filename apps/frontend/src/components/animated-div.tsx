import { useRef } from "react";
import { type HTMLMotionProps, motion, useInView, type Variants } from "motion/react";

const staggerUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" },
  }),
};

interface Props extends HTMLMotionProps<"div"> {
  custom?: number;
  variants?: Variants;
}

// TODO: define presets.. for example
// for headers.. fade in up
// for cards.. stagger up
// etc

export function AnimatedDiv({
  custom = 0,
  variants = staggerUp,
  initial = "hidden",
  animate = "visible",
  ...props
}: Props) {
  return <motion.div custom={custom} variants={variants} initial={initial} animate={animate} {...props} />;
}

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

export function ScrollReveal({ children, delay = 0, ...props }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
