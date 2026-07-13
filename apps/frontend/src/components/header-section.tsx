import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HeaderSectionProps {
  title: string;
  description?: React.ReactNode | string;
  onBack: () => void;
}

export function HeaderSection({ title, description, onBack }: HeaderSectionProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Button type="button" variant="secondary" size="icon" onClick={onBack} className="shrink-0">
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="font-bold text-lg">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
