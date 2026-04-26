export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  startDate: string;
  endDate: string;
}

export interface TransactionRow {
  transactionId: number;
  amount: number;
  description: string;
  transactionDate: string;
  isIncome: boolean;
  categoryId: number;
  categoryName: string;
  paymentMethod?: string | null;
}
