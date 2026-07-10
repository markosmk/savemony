import { createFileRoute } from "@tanstack/react-router";

import { SettingsView } from "@/components/settings/settings-view";

export const Route = createFileRoute("/_private/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <SettingsView />
    </div>
  );
}
