import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ScrollReveal } from "@/components/animated-div";
import { ListingPlans } from "@/components/shared/listing-plans";
import { StatsCard } from "@/components/shared/stats-card";
import { useAuth } from "@/services/auth.hooks";
import { usePlans } from "@/services/plans.hooks";
import { useAnalytics } from "@/services/stats.hooks";

export const Route = createFileRoute("/_private/panel")({
  component: ComponentPage,
});

// Time-of-day greeting
function getTimeGreeting(hour: number) {
  return hour >= 5 && hour < 12
    ? { text: "Buenos días", emoji: "☀️", illustration: "morning" as const }
    : hour >= 12 && hour < 18
      ? {
          text: "Buenas tardes",
          emoji: "🌤️",
          illustration: "afternoon" as const,
        }
      : {
          text: "Buenas noches",
          emoji: "🌙",
          illustration: "night" as const,
        };
}

function ComponentPage() {
  const { user } = useAuth();
  const { data: plans, isLoading } = usePlans();
  const { data: stats, isLoading: isLoadingStats } = useAnalytics();

  const firstName = useMemo(() => user?.name?.split(" ")[0] || "Ahorrador", [user]);
  const timeGreeting = useMemo(() => getTimeGreeting(new Date().getHours()), []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6">
      <ScrollReveal className="mb-6">
        <div className="bg-muted rounded-2xl">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="flex-1">
              <ScrollReveal delay={0.1} className="mb-0.5 text-sm font-medium">
                {timeGreeting.emoji}
                <span className="px-2">{timeGreeting.text}</span>
              </ScrollReveal>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">¡Hola, {firstName}! 👋</h1>
              <p className="mt-1 text-sm text-muted-foreground">Aquí está tu resumen de ahorros</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
          <StatsCard data={stats} isLoading={isLoadingStats} currency={"CLP"} />
        </div>
      </ScrollReveal>

      {/* Weekly Summary Card */}
      {/* <ScrollReveal delay={0.1}>
						<WeeklySummaryCard
							data={weeklyStats}
							isLoading={isLoadingWeekly}
							currency={currency}
						/>
					</ScrollReveal> */}

      {/* Motivational Quotes Banner */}
      {/* <ScrollReveal delay={0.15}>{!isLoading && <MotivationalBanner />}</ScrollReveal> */}

      {/* Savings Activity Chart */}
      {/* <ScrollReveal delay={0.2}>
						<SavingsChart />
					</ScrollReveal> */}

      {/* Daily Tip */}
      {/* <ScrollReveal delay={0.25}>
						<div className="mb-8">
							<DailyTip />
						</div>
					</ScrollReveal> */}

      {/* Savings Challenge */}
      {/* <ScrollReveal delay={0.3}>
						<SavingsChallenge />
					</ScrollReveal> */}

      {/* Streak Calendar Heatmap */}
      {/* <ScrollReveal delay={0.35}>
						<StreakCalendar />
					</ScrollReveal> */}

      {/* Smart Savings Reminder */}
      {/* <ScrollReveal delay={0.37}>
						<div className="mb-8">
							{mostUrgentPlan && (
								<SavingsReminder plan={mostUrgentPlan} key={reminderKey} onDismiss={() => setReminderKey((k) => k + 1)} />
							)}
						</div>
					</ScrollReveal> */}

      {/* <ScrollReveal delay={0.39}>
						<div className="mb-8">
							<SavingsCalculator />
						</div>
					</ScrollReveal> */}

      <ListingPlans plans={plans} isLoading={isLoading} />
    </main>
  );
}
