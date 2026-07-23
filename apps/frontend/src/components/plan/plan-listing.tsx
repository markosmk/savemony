import { useState } from "react";
import { formatCurrency, type PlanWithProgress } from "@savemony/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../shared/empty-state";

type Filter = "all" | "active" | "completed" | "archived";

export function PlanListing({ plans }: { plans: PlanWithProgress[] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = plans?.filter((p) => (filter === "all" ? true : p.status === filter)) || [];

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "completed", label: "Completados" },
    { key: "archived", label: "Archivados" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            type="button"
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
              filter === f.key ? "bg-primary" : "bg-accent text-muted-foreground hover:opacity-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-muted-foreground">No hay planes {filter !== "all" ? "en esta categoría" : ""}</p>
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 &&
          (filter === "all" && !plans?.length ? (
            <EmptyState
              illustration="savings"
              title="Crea tu primer plan"
              description="Comienza tu viaje de ahorro. Elige un objetivo y un método para empezar."
              actionLabel="Crear Plan"
              onAction={() => navigate({ to: "/plans/create" })}
            />
          ) : filter === "archived" ? (
            <EmptyState
              emoji="📦"
              title="No hay planes archivados"
              description="Los planes que archives aparecerán aquí."
            />
          ) : (
            <EmptyState
              emoji="🔍"
              title="No hay planes en esta categoría"
              description="Intenta cambiar el filtro o crea un nuevo plan."
            />
          ))}

        {filtered.map((plan) => (
          <PlanListItem key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanListItem({ plan }: { plan: PlanWithProgress }) {
  const statusColors = {
    active: "border-emerald-200 dark:border-emerald-600 dark:bg-emerald-950/20",
    completed: "border-emerald-300 bg-emerald-50/30 dark:border-emerald-600 dark:bg-emerald-950/20",
    archived: "border-gray-200 opacity-60 dark:border-gray-600 dark:bg-gray-950/20",
  };

  return (
    <Link
      to="/plans/$planId"
      params={{ planId: plan.id }}
      className={`block bg-muted rounded-lg p-4 border transition-all ${statusColors[plan.status as keyof typeof statusColors] || "border-input"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{plan.name}</h3>
            {plan.isFlexible && (
              <Badge variant="secondary" className="text-xs">
                Flexible
              </Badge>
            )}
          </div>

          {!plan.isFlexible && plan.progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{plan.progress.percentage}%</span>
                <span>{formatCurrency(plan.progress.netSaved)}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${plan.progress.percentage}%` }} />
              </div>
            </div>
          )}

          {plan.isFlexible && plan.progress && (
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(plan.progress.netSaved)} ahorrados</p>
          )}

          {/* Fecha límite */}
          {/* {plan.endDate && !isArchived && <p className="text-xs text-muted-foreground mt-2">Hasta {formatDate(plan.endDate)}</p>} */}
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          {plan.streak && plan.streak.current > 0 && plan.status === "active" && (
            <span className="flex items-center gap-0.5 text-sm">
              <span>🔥</span>
              <span className="font-medium text-orange-600">{plan.streak.current}</span>
            </span>
          )}
          <span className="text-muted-foreground">
            <ChevronRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
