export interface ReceiptExtraction {
  vendorName: string;
  transactionDate: string | null;
  totalAmount: number;
  /** OCR metnine göre gelir sinyali (dekont/iade vb.) */
  isIncome: boolean;
  /** Ses transkripti veya OCR ham metni (varsa gösterilir) */
  rawText?: string | null;
}

export interface ReceiptExtractResponse {
  extraction: ReceiptExtraction;
  suggestedCategoryName: string;
  suggestedCategoryId: number;
  /** AI + OCR birleşik öneri */
  suggestedIsIncome: boolean;
  /** Fiş veya sesli giriş — onay ekranı için */
  source?: 'receipt' | 'voice';
}
