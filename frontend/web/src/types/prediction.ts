export interface PredictionResponse {
  estimatedAmount: number;
  predictedMonth: string;
  message: string;
}

export interface AnomalyAlert {
  categoryName: string;
  categoryId?: number | null;
  currentAmount: number;
  historicalAverage: number;
  standardDeviation: number;
  zScore: number;
  severity: string;
  message: string;
  detectedByML: boolean;
}

export interface AnomaliesResponse {
  anomalies: AnomalyAlert[];
  periodStart: string;
  periodEnd: string;
  monthsCompared: number;
  message?: string | null;
}
