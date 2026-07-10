import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { ListingPlans } from "@/components/shared/listing-plans";
import { Button } from "@/components/ui/button";
import { usePlans } from "@/services/plans.hooks";

export const Route = createFileRoute("/_private/plans/")({
  component: PlansPage,
});

function PlansPage() {
  const { data, isLoading } = usePlans();
  const navigate = Route.useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Planes de Ahorro</h1>
          <p className="text-sm text-muted-foreground">
            Visualizá tu progreso, gestioná tus objetivos de ahorro y completá tus metas.
          </p>
        </div>
        <Button type="button" onClick={() => navigate({ to: "/plans/create" })} className="gap-2">
          <PlusIcon className="size-4" />
          Crear Plan
        </Button>
      </div>

      <ListingPlans plans={data} isLoading={isLoading} />
    </div>
  );
}
