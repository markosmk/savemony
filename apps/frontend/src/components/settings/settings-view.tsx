import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, Sparkles } from "lucide-react";

import { AnimatedDiv } from "@/components/animated-div";
import { AboutContent } from "@/components/dialogs/about-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/services/auth.hooks";
import { useSettings } from "@/services/settings.hooks";
import { useModal } from "@/stores/modal/use-modal-store";
import { ArchivedPlansSection } from "./archived-plans-section";
import { DeleteAccountSection } from "./delete-account-section";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { SettingsForm } from "./settings-form";

export function SettingsView() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { user } = useAuth();
  const { data, isLoading, error } = useSettings();
  const currency = data?.currency ?? "ARS";

  const handleAbout = () =>
    openModal({
      content: AboutContent,
    });

  if (isLoading) {
    return (
      <div>
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data || !user) {
    return (
      <div>
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No se pudo cargar la configuración. Intenta de nuevo.</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:px-6">
        {/* Header */}
        <AnimatedDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/panel" })} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">Configuración</h1>
            <p className="text-xs text-muted-foreground">Personaliza tu experiencia de ahorro</p>
          </div>
        </AnimatedDiv>

        <AnimatedDiv custom={1}>
          <ProfileForm user={user} />
        </AnimatedDiv>
        <AnimatedDiv custom={2}>
          <ArchivedPlansSection currency={currency} />
        </AnimatedDiv>
        <AnimatedDiv custom={3}>
          <SettingsForm settings={data} />
        </AnimatedDiv>
        <AnimatedDiv custom={4}>
          <SecurityForm />
        </AnimatedDiv>
        <AnimatedDiv custom={5}>
          <DeleteAccountSection user={user} />
        </AnimatedDiv>

        {/* About Section */}
        <AnimatedDiv custom={6}>
          <Card className="mb-4 overflow-hidden">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Sparkles className="size-5 text-emerald-600" />
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
                <Info className="size-4" />
                Acerca de
              </Button>
            </CardContent>
          </Card>
        </AnimatedDiv>
      </main>
    </div>
  );
}
