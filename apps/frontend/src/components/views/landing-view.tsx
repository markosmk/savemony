import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Globe as Github,
  Grid3X3,
  Heart,
  Globe as Instagram,
  Layers,
  Mail,
  MessageCircle,
  Shield,
  Sparkles,
  Globe as Twitter,
  Users,
  Zap,
} from "lucide-react";
import { motion, useInView } from "motion/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FEATURES = [
  {
    icon: Grid3X3,
    title: "Grilla Inteligente",
    description: "Celdas con montos variables que distribuyen tu meta de forma equilibrada y motivadora.",
    emoji: "🎯",
  },
  {
    icon: Layers,
    title: "7 Métodos de Ahorro",
    description: "52 Semanas, 100 Sobres, 365 Días, Redondeo y más. Elige el que mejor se adapte a ti.",
    emoji: "📋",
  },
  {
    icon: Sparkles,
    title: "Gamificación",
    description: "Logros, rachas, niveles y confetti. Ahorrar nunca fue tan divertido.",
    emoji: "🏆",
  },
  {
    icon: Clock,
    title: "Timeline",
    description: "Historial completo de tu progreso con hitos, notas y recuerdos.",
    emoji: "📅",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: "🎯",
    title: "Define tu meta",
    description: "Elige qué quieres ahorrar y cuánto necesitas",
  },
  {
    step: 2,
    icon: "✅",
    title: "Desbloquea celdas",
    description: "Marca cada celda cuando completes un aporte",
  },
  {
    step: 3,
    icon: "🎉",
    title: "Alcanza tu objetivo",
    description: "Completa la grilla y celebra tu logro",
  },
];

const TESTIMONIALS = [
  {
    name: "María G.",
    initials: "MG",
    quote: "Ahorré $500.000 en 3 meses con el método 52 semanas. ¡Nunca pensé que fuera tan fácil!",
    role: "Diseñadora UX",
    rating: 5,
    rotation: -1,
  },
  {
    name: "Carlos R.",
    initials: "CR",
    quote: "La grilla me mantiene motivada todos los días. Cada celda completada es una pequeña victoria.",
    role: "Ingeniero de Software",
    rating: 5,
    rotation: 0.5,
  },
  {
    name: "Ana L.",
    initials: "AL",
    quote: "La mejor forma de ahorrar que he probado. Los logros y la gamificación hacen toda la diferencia.",
    role: "Estudiante de Medicina",
    rating: 5,
    rotation: -0.5,
  },
  {
    name: "Pedro M.",
    initials: "PM",
    quote: "La gamificación es lo que me faltaba. Ahorré $300.000 en 4 meses sin sentir esfuerzo.",
    role: "Estudiante de Diseño",
    rating: 5,
    rotation: 1,
  },
  {
    name: "Laura S.",
    initials: "LS",
    quote: "Uso SaveGrid con mis alumnos y les encantó. Ahora todos quieren ahorrar.",
    role: "Profesora",
    rating: 5,
    rotation: -0.5,
  },
];

// Mini grid sample data — some cells completed (true), some pending (false)
const MINI_GRID_DATA: boolean[][] = [
  [true, true, true, false, false, true, true, false],
  [true, true, false, false, true, true, false, false],
  [true, false, false, true, true, false, false, false],
  [false, false, true, true, false, false, false, false],
  [false, true, true, false, false, false, false, false],
  [true, true, false, false, false, false, false, false],
];

const MINI_GRID_AMOUNTS: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31, 32],
  [33, 34, 35, 36, 37, 38, 39, 40],
  [41, 42, 43, 44, 45, 46, 47, 48],
];

const FLOATING_ICONS = [
  { emoji: "💰", top: "10%", left: "8%", delay: 0, size: "text-4xl" },
  { emoji: "🐷", top: "20%", right: "10%", delay: 1.5, size: "text-3xl" },
  { emoji: "🪙", bottom: "30%", left: "5%", delay: 0.8, size: "text-3xl" },
  { emoji: "💎", top: "60%", right: "8%", delay: 2, size: "text-2xl" },
  { emoji: "✨", top: "35%", left: "15%", delay: 1, size: "text-2xl" },
  { emoji: "⭐", bottom: "15%", right: "15%", delay: 0.5, size: "text-3xl" },
];

const STATS = [
  { value: 7, suffix: "", label: "métodos", icon: Grid3X3 },
  { value: 12, suffix: "", label: "logros", icon: Zap },
  { value: 9, suffix: "", label: "monedas", icon: Shield },
];

const FOOTER_LINKS = {
  producto: ["Funciones", "Métodos", "Precios", "FAQ"],
  empresa: ["Acerca de", "Blog", "Contacto", "Empleo"],
  legal: ["Privacidad", "Términos", "Cookies"],
};

// ──────────────────────────────────────────────
// Animated counter hook
// ──────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1500, shouldStart = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration, shouldStart]);

  return count;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function AnimatedCounter({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const count = useAnimatedCounter(target, 1200, inView);

  return (
    <span className={inView ? "animate-counter-pop" : ""}>
      {count}
      {suffix}
    </span>
  );
}

function MiniGridPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="relative mx-auto mt-10 w-fit"
    >
      {/* Glow behind the grid */}
      <div className="absolute inset-0 -m-4 rounded-2xl bg-linear-to-br from-primary/20 via-emerald-400/10 to-emerald-600/20 blur-xl" />

      <div className="relative rounded-xl border border-primary/10 bg-card/80 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
        {/* Mini header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs">🎯</div>
            <span className="text-xs font-semibold">Vacaciones de Verano</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            52 Semanas
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Progreso</span>
            <span className="text-[10px] font-semibold text-primary">14/48 celdas</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "29%" }}
              transition={{ duration: 1, delay: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-primary to-emerald-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-8 gap-1">
          {MINI_GRID_DATA.map((row, rowIdx) =>
            row.map((completed, colIdx) => (
              <motion.div
                key={`${rowIdx}-${colIdx}`}
                initial={completed ? { scale: 0 } : { opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: 0.8 + (rowIdx * 8 + colIdx) * 0.02,
                }}
                className={`mini-grid-cell aspect-square ${
                  completed ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground/60"
                }`}
              >
                {MINI_GRID_AMOUNTS[rowIdx][colIdx]}
              </motion.div>
            )),
          )}
        </div>

        {/* Stats row below grid */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Ahorrado:</span>
            <span className="text-[10px] font-bold text-primary">$127.000</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Meta:</span>
            <span className="text-[10px] font-bold">$500.000</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-500">
            🔥 <span className="font-semibold">7 días</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroBlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Blob 1 */}
      <div
        className="animate-blob-1 absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96"
        style={{ animationDelay: "0s" }}
      />
      {/* Blob 2 */}
      <div
        className="animate-blob-2 absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-emerald-400/8 blur-3xl sm:h-80 sm:w-80"
        style={{ animationDelay: "2s" }}
      />
      {/* Blob 3 */}
      <div
        className="animate-blob-3 absolute -bottom-16 right-1/4 h-56 w-56 rounded-full bg-emerald-500/6 blur-3xl sm:h-72 sm:w-72"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
    >
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={inView} />
              </div>
              <div className="text-xs text-muted-foreground -mt-0.5">{stat.label}</div>
            </div>
            {i < STATS.length - 1 && <div className="h-4 w-px bg-border hidden sm:block" />}
          </div>
        );
      })}
    </motion.div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">
          ★
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Landing View
// ──────────────────────────────────────────────

export function LandingView() {
  const navigate = useNavigate();
  const [currentYear] = useState(() => new Date().getFullYear());

  // const handleGetStarted = useCallback(() => setView("register"), [setView]);
  // const handleLogin = useCallback(() => setView("login"), [setView]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* CSS-only floating particles background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { size: "size-2", top: "15%", left: "10%" },
          { size: "size-1.5", top: "25%", left: "85%" },
          { size: "size-2.5", top: "45%", left: "20%" },
          { size: "size-1", top: "55%", left: "70%" },
          { size: "size-2", top: "75%", left: "30%" },
          { size: "size-1.5", top: "85%", left: "60%" },
          { size: "size-3", top: "10%", left: "50%" },
          { size: "size-1", top: "65%", left: "90%" },
        ].map((particle, i) => (
          <div
            key={i}
            className={`css-particle ${particle.size}`}
            style={{
              top: particle.top,
              left: particle.left,
            }}
          />
        ))}
      </div>

      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATING_ICONS.map((item, i) => (
          <div
            key={i}
            className={`absolute ${item.size} opacity-20 dark:opacity-10 animate-float`}
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              animationDelay: `${item.delay}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative flex-1 flex items-center justify-center px-4 pt-20 pb-16">
        <HeroBlobBackground />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            Ahorro gamificado para todos
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span className="block">Tu planificador de</span>
            <span className="block mt-1 bg-linear-to-r from-primary via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              ahorro gamificado
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground sm:text-xl"
          >
            Desbloquea celdas, alcanza tus metas. Comienza tu viaje de ahorro con grillas interactivas, logros y
            diversión.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
              onClick={() => navigate({ to: "/register" })}
            >
              Comenzar Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-semibold hover:bg-primary/5 transition-colors"
              onClick={() => navigate({ to: "/login" })}
            >
              Iniciar Sesión
            </Button>
          </motion.div>

          {/* Stats with animated counters */}
          <StatsBar />

          {/* Mini grid preview */}
          <MiniGridPreview />

          {/* Animated particle background dots */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/10"
                style={{
                  width: 4 + Math.random() * 6,
                  height: 4 + Math.random() * 6,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-medium">
              Cómo Funciona
            </Badge>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Ahorrar en 3 simples pasos</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Un proceso diseñado para ser sencillo, visual y motivador
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative"
              >
                {/* Connector line (desktop) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[calc(50%+48px)] w-[calc(100%-96px)] h-px">
                    <div className="w-full h-full border-t-2 border-dashed border-primary/20" />
                    <ChevronRight className="absolute -right-2 -top-2 h-4 w-4 text-primary/30" />
                  </div>
                )}

                <Card className="h-full text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    {/* Step number + icon */}
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-emerald-500/10 text-4xl group-hover:from-primary/15 group-hover:to-emerald-500/15 transition-colors">
                        {item.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                        {item.step}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-medium">
              Funciones
            </Badge>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Todo lo que necesitas para ahorrar</h2>
            <p className="text-muted-foreground">Herramientas diseñadas para mantenerte motivado</p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20 feature-card-glow">
                    <CardContent className="relative p-5">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl group-hover:scale-110 transition-transform duration-300">
                        {feature.emoji}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─── */}
      <section className="relative px-4 py-24">
        {/* Subtle background tint */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/2 to-transparent" />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-medium">
              Testimonios
            </Badge>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Lo que dicen nuestros usuarios</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Miles de personas ya están alcanzando sus metas de ahorro
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -4, rotate: 0 }}
                style={{ rotate: testimonial.rotation }}
              >
                <Card className="h-full testimonial-glass rounded-2xl">
                  <CardContent className="flex flex-col gap-4 p-6">
                    {/* Quote */}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-foreground/90 italic">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                    </div>

                    {/* Rating */}
                    <StarRating count={testimonial.rating} />

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section id="cta-section" className="relative px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Card className="border-primary/20 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/[0.07] via-background to-emerald-50/50 dark:to-emerald-950/20" />
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />

            <CardContent className="relative flex flex-col items-center gap-5 p-10 text-center sm:p-14">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl shadow-lg shadow-primary/10">
                🚀
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">Comienza tu primer plan hoy</h2>
              <p className="max-w-lg text-muted-foreground leading-relaxed">
                Elige tu objetivo, selecciona un método y empieza a desbloquear celdas. Tu yo futuro te lo agradecerá.
              </p>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>100% Gratuito</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>+5,000 usuarios activos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                  <span>Sin tarjeta de crédito</span>
                </div>
              </div>

              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate({ to: "/register" })}
              >
                Crear mi primer plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ─── ENHANCED FOOTER ─── */}
      <motion.footer
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative border-t bg-muted/30"
      >
        <div className="mx-auto max-w-5xl px-4">
          {/* Main footer content */}
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg">🎯</div>
                <span className="font-bold text-xl tracking-tight">
                  Save<span className="text-primary">Grid</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
                Tu planificador de ahorro gamificado. Transforma tus metas financieras en un juego divertido y
                motivador.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2">
                {[
                  { icon: Twitter, label: "Twitter" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Github, label: "GitHub" },
                  { icon: MessageCircle, label: "Discord" },
                  { icon: Mail, label: "Email" },
                ].map(({ icon: SocialIcon, label }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-colors"
                        aria-label={label}
                      >
                        <SocialIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Producto</h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.producto.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => navigate({ to: "/" })}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.empresa.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => navigate({ to: "/" })}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator />

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
            <p>© {currentYear} SaveGrid. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              Hecho con <Heart className="h-3 w-3 text-primary fill-primary" /> para tu futuro financiero
            </p>
          </div>
        </div>
      </motion.footer>

      {/* ─── FLOATING ACTION BUTTON ─── */}
      <motion.button
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => {
          document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 backdrop-blur-md md:hidden"
        aria-label="Comenzar Gratis"
      >
        <span>🚀</span>
        <span>Comenzar Gratis</span>
      </motion.button>
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => {
          document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="fixed bottom-6 right-6 z-50 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 backdrop-blur-md hover:bg-primary/90 transition-colors"
        aria-label="Comenzar Gratis"
      >
        <span className="text-xl">💰</span>
      </motion.button>
    </div>
  );
}
