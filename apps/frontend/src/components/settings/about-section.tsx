import { InfoIcon, SparklesIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useModal } from "@/stores/modal/use-modal-store";
import { AboutContent } from "../dialogs/about-content";
import { Button } from "../ui/button";

export function AboutSection() {
  const { openModal } = useModal();
  const handleAbout = () =>
    openModal({
      content: AboutContent,
    });

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <SparklesIcon className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SaveMony</p>
            <p className="text-xs text-muted-foreground">Versión 1.0.1</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          SaveMony es un planificador de ahorros gamificado. Crea planes personalizados, desbloquea logros, mantén
          rachas y alcanza tus metas financieras de forma divertida y motivadora.
        </p>
        <Button variant="outline" size="sm" className="gap-2 w-full" onClick={handleAbout}>
          <InfoIcon className="size-4" />
          Acerca de
        </Button>
      </CardContent>
    </Card>
  );
}
