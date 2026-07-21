import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type SettingsUpdateInput, settingsUpdateSchema } from "@savemony/shared";
import type { Settings } from "@savemony/types";
import { Palette } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ButtonLoading } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldController } from "@/components/ui/field-controller";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUpdateSettings } from "@/services/settings.hooks";

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsUpdateInput>({
    resolver: standardSchemaResolver(settingsUpdateSchema),
    defaultValues: {
      // currency: settings.currency ?? "CLP",
      language: settings.language ?? "es",
      reminderEnabled: Boolean(settings.reminderEnabled),
      achievementNotifs: Boolean(settings.achievementNotifs),
      weeklySummary: Boolean(settings.weeklySummary),
    },
  });

  const onSubmit = (values: SettingsUpdateInput) => {
    updateSettings.mutate(values, {
      onSuccess: () => {
        toast.success("Configuración guardada");
        form.reset(values);
      },
      onError: () => toast.error("Error al guardar"),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Preferences Section */}
      <Card className="mb-4 overflow-hidden gap-4">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <Palette className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            Preferencias
          </CardTitle>
          <CardDescription className="ml-11 sr-only">Ajusta tu moneda, idioma y notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <FieldController
              control={form.control}
              name="currency"
              render={(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" {...field}>
                    <SelectValue placeholder={`Selecciona moneda: -- ${field.value} -- valor`} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{c.symbol}</span>
                          <span>{c.code}</span>
                          <span className="text-muted-foreground">— {c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            /> */}

            <FieldController
              control={form.control}
              name="language"
              render={(field) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className="w-full" {...field}>
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Separator />

          {/* Reminder Toggle */}
          <FieldController
            name="reminderEnabled"
            control={form.control}
            label={
              <div className="flex flex-col gap-1">
                <p>Recordatorios de ahorro</p>
                <p className="text-xs normal-case text-muted-foreground">
                  Recibe un recordatorio diario para no olvidar ahorrar
                </p>
              </div>
            }
            orientation="horizontal"
            render={({ value, onChange, ...field }) => <Switch checked={value} onCheckedChange={onChange} {...field} />}
          />

          <Separator />

          {/* Achievement Notifications */}
          <FieldController
            name="achievementNotifs"
            control={form.control}
            label={
              <div className="flex flex-col gap-1">
                <p>Notificaciones de logros</p>
                <p className="text-xs normal-case text-muted-foreground">
                  Sé notificado cuando desbloquees un nuevo logro
                </p>
              </div>
            }
            orientation="horizontal"
            render={({ value, onChange, ...field }) => <Switch checked={value} onCheckedChange={onChange} {...field} />}
          />

          <Separator />

          {/* Weekly Summary */}
          <FieldController
            name="weeklySummary"
            control={form.control}
            label={
              <div className="flex flex-col gap-1">
                <p>Resumen semanal</p>
                <p className="text-xs normal-case text-muted-foreground">
                  Recibe un resumen de tu actividad de ahorro cada semana
                </p>
              </div>
            }
            orientation="horizontal"
            render={({ value, onChange, ...field }) => <Switch checked={value} onCheckedChange={onChange} {...field} />}
          />

          {/* Save Button */}
          <ButtonLoading
            type="submit"
            disabled={updateSettings.isPending || !form.formState.isDirty}
            isPending={updateSettings.isPending}
            size="lg"
          >
            Guardar Cambios
          </ButtonLoading>
        </CardContent>
      </Card>
    </form>
  );
}
