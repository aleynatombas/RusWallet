/** GET /api/Analysis/insights — backend SmartInsightsDtos.cs ile birebir. */

export type InsightStatus = 'ready' | 'insufficient_data' | 'error';
export type DataLevel = 'insufficient' | 'limited' | 'good';

export interface DataSufficiencyDto {
  level: DataLevel;
  historyDays: number;
  expenseTransactionCount: number;
  completeMonths: number;
  requiredHistoryDays: number;
  requiredTransactions: number;
  message: string;
}

export interface ForecastSeriesPointDto {
  year: number;
  month: number;
  label: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
  kind: 'complete' | 'current' | 'forecast';
}

export interface ForecastBacktestDto {
  holdoutDays: number;
  actualTotal: number;
  ssaPredictedTotal: number | null;
  ssaErrorPercent: number | null;
  baselinePredictedTotal: number;
  baselineErrorPercent: number;
  selectedModel: string;
}

export interface CategoryDriverDto {
  categoryName: string;
  last3MonthAverage: number;
  trendPercent: number | null;
  sharePercent: number;
}

export interface RecurringPaymentDto {
  name: string;
  categoryName: string;
  expectedAmount: number;
  typicalDayOfMonth: number;
  monthsObserved: number;
  isSubscription: boolean;
}

export interface ForecastInsightDto {
  status: InsightStatus;
  dataQuality: DataSufficiencyDto;
  targetMonthLabel: string;
  targetYear: number;
  targetMonth: number;
  predictedTotal: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  recurringComponent: number;
  variableComponent: number;
  lastMonthTotal: number | null;
  changeVsLastMonthPercent: number | null;
  currentMonthActualToDate: number;
  currentMonthProjectedTotal: number | null;
  method: 'ssa' | 'seasonal_baseline' | '';
  modelName: string;
  backtest: ForecastBacktestDto | null;
  series: ForecastSeriesPointDto[];
  categoryDrivers: CategoryDriverDto[];
  recurringPayments: RecurringPaymentDto[];
  aiCommentary: string | null;
  /** AI metni rakam içerirse backend reddeder ve kural tabanlı metne düşer. */
  aiCommentarySource: 'openai' | 'rule_based';
  message: string;
}

export type AnomalyType = 'unusual_transaction' | 'category_spike' | 'frequency_spike';

export interface AnomalyItemDto {
  key: string;
  type: AnomalyType;
  severity: 'high' | 'medium';
  categoryName: string;
  categoryId: number | null;
  transactionId: number | null;
  description: string | null;
  date: string | null;
  currentAmount: number;
  normalAmount: number;
  deviationPercent: number;
  currentCount: number | null;
  normalCount: number | null;
  reason: string;
  explanation: string;
  anomalyScore: number | null;
  detectionMethods: string[];
}

export interface AnomalyInsightDto {
  status: InsightStatus;
  dataQuality: DataSufficiencyDto;
  items: AnomalyItemDto[];
  totalCount: number;
  topCategoryName: string | null;
  evaluatedWindowDays: number;
  evaluatedTransactionCount: number;
  excludedRecurringCount: number;
  dismissedCount: number;
  modelName: string;
  message: string;
}

export interface MonthAmountDto {
  label: string;
  amount: number;
}

export interface SavingsOpportunityDto {
  id: string;
  kind: 'category_reduction' | 'subscription_price_increase' | 'overlapping_subscriptions';
  categoryName: string;
  monthlySaving: number;
  yearlySaving: number;
  currentLevel: number;
  targetLevel: number;
  confidence: 'high' | 'medium' | 'low';
  priorityScore: number;
  reasonCodes: string[];
  reasons: string[];
  monthlyHistory: MonthAmountDto[];
  relatedSubscriptions: RecurringPaymentDto[];
  title: string;
  explanation: string;
  action: string;
  narrativeSource: 'openai' | 'rule_based';
  usedMlForecast: boolean;
}

export interface SavingsInsightDto {
  status: InsightStatus;
  dataQuality: DataSufficiencyDto;
  totalMonthlyPotential: number;
  totalYearlyPotential: number;
  monthlySubscriptionTotal: number;
  opportunities: SavingsOpportunityDto[];
  message: string;
}

export interface SmartInsightsResponseDto {
  generatedAtUtc: string;
  forecast: ForecastInsightDto;
  anomalies: AnomalyInsightDto;
  savings: SavingsInsightDto;
  spendingHabits: SpendingHabitsInsightDto;
  trend: FinancialTrendInsightDto;
  narrativeSource: 'openai' | 'rule_based';
}

export interface CategoryShareDto {
  categoryName: string;
  amount: number;
  sharePercent: number;
  previousAmount: number | null;
  changePercent: number | null;
  transactionCount: number;
  isFixed: boolean;
  isOther: boolean;
}

export interface SpendingHabitsInsightDto {
  status: InsightStatus;
  dataQuality: DataSufficiencyDto;
  monthLabel: string;
  totalExpense: number;
  previousPeriodTotal: number | null;
  changeVsPreviousPercent: number | null;
  previousPeriodLabel: string;
  transactionCount: number;
  fixedSharePercent: number;
  categories: CategoryShareDto[];
  commentary: string | null;
  commentarySource: 'openai' | 'rule_based';
  message: string;
}

export interface TrendMonthDto {
  year: number;
  month: number;
  label: string;
  hasData: boolean;
  isPartial: boolean;
  income: number | null;
  expense: number | null;
  net: number | null;
  expenseChangePercent: number | null;
}

export interface TrendForecastDto {
  label: string;
  expense: number;
  lower: number | null;
  upper: number | null;
}

export interface FinancialTrendInsightDto {
  status: InsightStatus;
  dataQuality: DataSufficiencyDto;
  months: TrendMonthDto[];
  forecast: TrendForecastDto | null;
  highestExpenseMonthLabel: string | null;
  highestExpenseMonthAmount: number | null;
  averageMonthlyExpense: number | null;
  averageMonthlyIncome: number | null;
  lastCompleteMonthChangePercent: number | null;
  monthsWithData: number;
  monthsWithoutData: number;
  commentary: string | null;
  commentarySource: 'openai' | 'rule_based';
  message: string;
}
