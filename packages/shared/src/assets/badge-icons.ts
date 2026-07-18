import { CalendarIcon, CrownIcon, FlameIcon, MedalIcon, StarIcon, TrophyIcon } from "lucide-react";

export const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  week: FlameIcon,
  biweek: StarIcon,
  month: CalendarIcon,
  quarter: TrophyIcon,
  halfyear: MedalIcon,
  year: CrownIcon,
};
