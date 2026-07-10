import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAcceptChallenge, useChallenges } from "@/services/challenges.hooks";

export const Route = createFileRoute("/_private/challenges")({
  component: ChallengesPage,
});

function ChallengesPage() {
  const { data, isLoading } = useChallenges();
  const accept = useAcceptChallenge();
  // const check = useCheckProgress();

  if (isLoading) return <p>Cargando desafíos...</p>;

  if (!data) return <p>No hay desafíos</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">🏆 Desafíos</h1>
      {/* <button type="button" onClick={() => check.mutate()} disabled={check.isPending}>
        {check.isPending ? "Verificando..." : "🔄 Verificar progreso"}
      </button> */}

      {/* Activos */}
      <h2 className="text-lg font-semibold">En progreso</h2>
      {data?.active?.length === 0 && <p className="text-muted-foreground text-sm">No tenés desafíos activos</p>}
      <div className="grid gap-3">
        {data?.active?.map((uc) => (
          <div key={uc.id} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
            <h3>
              {uc.challenge.icon} {uc.challenge.title}
            </h3>
            <p>{uc.challenge.description}</p>
            <div style={{ height: 8, background: "#eee", borderRadius: 4 }}>
              <div
                style={{
                  width: `${Math.min(100, (uc.currentProgress / uc.challenge.targetValue) * 100)}%`,
                  height: "100%",
                  background: "#3b82f6",
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ fontSize: 12 }}>
              {uc.currentProgress} / {uc.challenge.targetValue}
              {uc.expiresAt ? ` — Expira: ${new Date(uc.expiresAt).toLocaleDateString("es-CL")}` : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Disponibles */}
      <h2 className="text-lg font-semibold">Disponibles</h2>
      {data?.available?.length === 0 && (
        <p className="text-muted-foreground text-sm">No hay más desafíos disponibles</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data?.available?.map((c) => (
          <div key={c.id} className="border-dashed border rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-semibold">
              {c.icon} {c.title}
            </h3>
            <p className="text-sm text-muted-foreground">{c.description}</p>
            <p className="text-sm">Recompensa: {c.rewardPoints} pts</p>
            <Button type="button" onClick={() => accept.mutate(c.id)} disabled={accept.isPending}>
              Aceptar desafío
            </Button>
          </div>
        ))}
      </div>

      {/* Completados */}
      {data?.completed?.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Completados ✅</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {data?.completed?.map((uc) => (
              <div
                key={uc.id}
                style={{
                  padding: 12,
                  border: "1px solid #10b981",
                  borderRadius: 8,
                  opacity: 0.7,
                }}
              >
                <h3>
                  {uc.challenge.icon} {uc.challenge.title}
                </h3>
                <p>Completado el {new Date(uc.completedAt || "").toLocaleDateString("es-CL")}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
