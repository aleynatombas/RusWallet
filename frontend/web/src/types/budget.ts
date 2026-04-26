export interface BudgetSuggestionDto {
  categoryName: string;
  categoryId: number;
  suggestedAmount: number;
  averageSpent: number;
  percentageOfTotal: number;
  monthsUsed: number;
  suggestedByML: boolean;
}

export interface BudgetSuggestionsResponseDto {
  suggestions: BudgetSuggestionDto[];
  monthsAnalyzed: number;
  message?: string | null;
}
