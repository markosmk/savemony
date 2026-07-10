import { createFileRoute } from "@tanstack/react-router";

import { AchievementsView } from "@/components/views/achievements-view";

export const Route = createFileRoute("/_private/achievements")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AchievementsView />;
}
