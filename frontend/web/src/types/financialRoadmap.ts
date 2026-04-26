/** GET /api/Analysis/roadmap — backend FinancialRoadmapResponseDto */
export interface InsightCardDto {
  id: string;
  kind: string;
  title: string;
  metric: string;
  why: string;
  actionLabel: string;
  actionChatMessage?: string | null;
  tone: string;
}

export interface MonthEndExpectationCockpitDto {
  projectedMonthTotal: number;
  daysRemainingInMonth: number;
  budgetFillPercent: number;
  isOverPaceVersusDisposable: boolean;
  hasDisposableReference: boolean;
  /** Tanıyalım sabit gider + yalnızca esnek tempo projeksiyonu kullanıldı mı */
  projectedUsesFixedPlusFlexibleSplit?: boolean;
  shortMessage: string;
  actionChatMessage?: string | null;
  /** predictive_analysis — AI + predictive gelecek ay tahmini */
  insightStack?: string;
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
  /** ml_anomaly — machine learning sıradışı harcama */
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
  /** ml_opportunity — machine learning tasarruf sinyalleri */
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

export interface UpcomingPaymentHintDto {
  categoryLabel: string;
  typicalMonthlyAmount: number;
  basisNote: string;
}

export interface CreditLimitGaugeDto {
  hasData: boolean;
  utilizationPercent?: number | null;
  message: string;
}

export interface CashFlowOutlookDto {
  upcomingHints: UpcomingPaymentHintDto[];
  predictedWeekExpenseTotal?: number | null;
  balanceOutlookMessage?: string | null;
  creditGauge?: CreditLimitGaugeDto | null;
}

export interface AnalysisQaModuleDto {
  question: string;
  optionA: string;
  optionB: string;
  chatMessageA: string;
  chatMessageB: string;
}

export interface MonthSpendSparklinePointDto {
  monthKey: string;
  shortLabel: string;
  totalExpense: number;
}

/** Son 6 ay, her ay bugünle aynı güne kadar gider (kıyaslanabilir dilim). */
export interface MonthSpendSparklineDto {
  points: MonthSpendSparklinePointDto[];
  percentChangeVsPreviousMonth: number | null;
  hasComparableData: boolean;
}

export interface FinancialRoadmapResponseDto {
  insightCards: InsightCardDto[];
  cockpit?: FinancialCockpitDto | null;
  lifestyle?: LifestyleProfileDto | null;
  cashFlow: CashFlowOutlookDto;
  qaModule?: AnalysisQaModuleDto | null;
  monthSpendSparkline?: MonthSpendSparklineDto | null;
}
