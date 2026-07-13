import { Grid3X3, Lock, Target } from "lucide-react";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const HOW_STEPS = [
  {
    title: "Define tu meta",
    desc: "Elige qué quieres ahorrar y establece un monto objetivo",
  },
  {
    title: "Genera tu grilla",
    desc: "SaveGrid crea una grilla personalizada con celdas de ahorro",
  },
  {
    title: "Desbloquea celdas",
    desc: "Marca cada celda cuando completes un aporte y celebra el progreso",
  },
];

export function AboutContent() {
  return (
    <>
      <div className="relative -mx-6 -mt-6 mb-0 overflow-hidden rounded-t-lg">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white/0.1,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,white/0.08,transparent)]" />
        <DialogHeader className="relative p-6 pb-5">
          <DialogTitle className="flex items-center gap-3 text-left text-white">
            <div>
              <span className="block text-xl font-extrabold tracking-tight">
                Save<span className="text-white/80">Mony</span>
              </span>
              <span className="block text-xs font-medium text-white/70">v1.0.1</span>
            </div>
          </DialogTitle>
        </DialogHeader>
      </div>

      <div className="space-y-5 pt-4">
        {/* Mission */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="size-4 text-primary" />
            Nuestra Misión
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ayudamos a las personas a alcanzar sus metas de ahorro de forma divertida y visual. Creemos que ahorrar no
            tiene que ser aburrido ni difícil.
          </p>
        </div>

        <Separator />

        {/* How it works */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Grid3X3 className="size-4 text-primary" />
            Cómo Funciona
          </div>
          <div className="space-y-2.5">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Privacy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lock className="size-4 text-primary" />
            Privacidad
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tus datos se almacenan de forma segura. No compartimos información con terceros.
          </p>
        </div>
      </div>
    </>
  );
}
