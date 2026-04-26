export interface UserFinancialProfilePayload {
  monthlyIncomeNet?: number | null;
  monthlyFixedCostsApprox?: number | null;
  mainGoal?: string | null;
  savingsTargetAmount?: number | null;
}

export interface OnboardingStateDto {
  completed: boolean;
  stepIndex: number;
  assistantMessage: string;
  profile?: UserFinancialProfilePayload | null;
  summaryLines?: string[] | null;
}

export interface OnboardingAnswerResponseDto {
  assistantReply: string;
  completed: boolean;
  nextStepIndex: number;
  profile?: UserFinancialProfilePayload | null;
  summaryLines?: string[] | null;
  assistantMessageFollowUp?: string | null;
}
