export interface ReceiptExtraction {
  vendorName: string;
  transactionDate: string | null;
  totalAmount: number;
  isIncome: boolean;
  rawText?: string | null;
}

export interface ReceiptExtractResponse {
  extraction: ReceiptExtraction;
  suggestedCategoryName: string;
  suggestedCategoryId: number;
  suggestedIsIncome: boolean;
  source?: 'receipt' | 'voice';
}
