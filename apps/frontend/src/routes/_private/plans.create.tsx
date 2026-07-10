import { createFileRoute } from "@tanstack/react-router";

import { NewPage } from "@/components/new-page";

export const Route = createFileRoute("/_private/plans/create")({
  component: ComponentPage,
});

function ComponentPage() {
  return <NewPage />;
}
