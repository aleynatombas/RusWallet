/** GET /api/Analysis/roadmap — backend FinancialRoadmapResponseDto (web ile aynı) */

export interface MonthEndExpectationCockpitDto {
  projectedMonthTotal: number;
  daysRemainingInMonth: number;
  budgetFillPercent: number;
  isOverPaceVersusDisposable: boolean;
  hasDisposableReference: boolean;
  projectedUsesFixedPlusFlexibleSplit?: boolean;
  shortMessage: string;
  actionChatMessage?: string | null;
  insightStack?: string;
  /** Sonraki takvim ayı gider öngörüsü (predictive). */
  forecastNextMonthTotal?: number | null;
}

export interface RadarHitItemDto {
  categoryLabel: string;
  amount: number;
  isUnusual: boolean;
}

export interface RadarHitsCockpitDto {
  isLowData: boolean;
  hasUnusualSpending: boolean;
  hits: RadarHitItemDto[];
  topMonthCategoryLabel?: string | null;
  topMonthCategoryAmount?: number | null;
  shortMessage: string;
  actionChatMessage?: string | null;
  insightStack?: string;
}

export interface OpportunityTileDto {
  iconEmoji: string;
  label: string;
  subtitle?: string | null;
  estimatedSaving?: number | null;
}

export interface OpportunityCornerCockpitDto {
  isLearning: boolean;
  tiles: OpportunityTileDto[];
  shortMessage: string;
  actionChatMessage?: string | null;
  insightStack?: string;
}

export interface FinancialCockpitDto {
  monthEnd: MonthEndExpectationCockpitDto;
  radar: RadarHitsCockpitDto;
  opportunities: OpportunityCornerCockpitDto;
}

export interface LifestyleProfileDto {
  flexibilityScore: number;
  mandatorySharePercent: number;
  discretionarySharePercent: number;
  summary: string;
}

export interface MonthSpendSparklinePointDto {
  monthKey: string;
  shortLabel: string;
  totalExpense: number;
}

export interface MonthSpendSparklineDto {
  points: MonthSpendSparklinePointDto[];
  percentChangeVsPreviousMonth: number | null;
  hasComparableData: boolean;
}

export interface AnalysisQaModuleDto {
  question: string;
  optionA: string;
  optionB: string;
  chatMessageA: string;
  chatMessageB: string;
}

export interface FinancialRoadmapResponseDto {
  cockpit?: FinancialCockpitDto | null;
  lifestyle?: LifestyleProfileDto | null;
  monthSpendSparkline?: MonthSpendSparklineDto | null;
  qaModule?: AnalysisQaModuleDto | null;
}
