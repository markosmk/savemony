export interface PlanDTO {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  category: string | null;
  targetAmount: number;
  currentAmount: number;
  method: string;
  status: string;
  streak: number;
  // additionals UI
  progressPercent: number;
  completedCells: number;
  totalCells: number;
}

export interface PlanDetailDTO {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  targetAmount: number;
  currentAmount: number;
  method: string;
  status: string;
  gridRows: number;
  gridCols: number;
  // rebalanceMode: string;
  // frequency: string;
  // minAmount: number;
  // maxAmount: number;
  // deadline: string | null;
  streak: number;
  lastSaveDate: string | null;
  archived: number;
  createdAt: string;
  updatedAt: string;
  cells: {
    id: string;
    position: number;
    amount: number;
    status: string;
    isLockedAmount: number;
    completedAt: string | null;
  }[];
  timelines: {
    id: string;
    description: string | null;
    type: string;
    amount: number | null;
    date: string | null;
    metadata: string | null;
    createdAt: string;
  }[];
  progressPercent: number;
  completedCells: number;
  totalCells: number;
}

export interface CellDTO {
  id: string;
  planId: string;
  status: string;
  position: number;
  amount: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsDTO {
  id: string;
  userId: string;
  currency: string;
  locale: string;
  language: string;
  reminderEnabled: number;
  achievementNotifs: number;
  weeklySummary: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineDTO {
  id: string;
  planId: string;
  cellId: string | null;
  description: string | null;
  amount: number | null;
  type: string;
  metadata: string | null;
  date: string;
  createdAt: string;
}

export interface ChallengeDTO {
  id: string;
  key: string;
  title: string;
  description: string;
  type: string;
  targetValue: number;
  durationDays: number | null;
  rewardPoints: number;
  isActive: boolean;
  createdAt: string | null;
}
