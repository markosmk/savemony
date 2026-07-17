export type RebalanceMode = "proportional" | "random";
export type PlanFrequency = "daily" | "weekdays" | "weekly" | "random";
export type PlanStatus = "active" | "completed" | "paused" | "abandoned" | "archived";
export type CellStatus = "pending" | "completed" | "locked";
export type TimelineType = "save" | "withdraw" | "adjust" | "milestone" | "note";
export type BudgetCategory =
  | "vacations"
  | "emergency"
  | "education"
  | "technology"
  | "home"
  | "health"
  | "transportation"
  | "other";
