import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/panel-page";

export const Route = createFileRoute("/_private/panel")({
  component: ComponentPage,
});

function ComponentPage() {
  return <PanelPage />;
}
