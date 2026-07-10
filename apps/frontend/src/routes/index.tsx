import { createFileRoute } from "@tanstack/react-router";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingView } from "@/components/views/landing-view";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <TooltipProvider>
      <LandingView />
    </TooltipProvider>
  );
}
