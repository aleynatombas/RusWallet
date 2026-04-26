export interface HealthScoreResult {
  score: number;
  title: string;
  subtitle: string;
}

/** Heuristik finansal sağlık skoru (0–100); gerçek AI değil, anomali + bakiye + trend birleşimi. */
export function computeFinancialHealthScore(params: {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  highAnomalies: number;
  mediumAnomalies: number;
  monthOverMonthPct: number | null;
}): HealthScoreResult {
  let score = 88;
  if (params.balance < 0) score -= 18;
  else if (params.balance < 500) score -= 6;

  if (params.totalIncome > 0 && params.totalExpense > params.totalIncome * 1.05) {
    score -= 14;
  }

  score -= params.highAnomalies * 10;
  score -= params.mediumAnomalies * 5;

  if (params.monthOverMonthPct !== null) {
    if (params.monthOverMonthPct > 35) score -= 14;
    else if (params.monthOverMonthPct > 20) score -= 8;
    else if (params.monthOverMonthPct > 10) score -= 4;
    else if (params.monthOverMonthPct < -5) score += 4;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let title: string;
  let subtitle: string;
  if (score >= 85) {
    title = 'Finansal sağlığın çok iyi';
    subtitle = 'Harcama alışkanlıkların dengeli görünüyor. Böyle devam.';
  } else if (score >= 70) {
    title = 'Finansal sağlığın iyi';
    subtitle = 'Küçük iyileştirmelerle daha da güçlendirebilirsin.';
  } else if (score >= 50) {
    title = 'Dikkat etmen gereken noktalar var';
    subtitle = 'Aşağıdaki uyarıları ve önerileri incelemen faydalı olur.';
  } else {
    title = 'Harcama tarafında risk işaretleri';
    subtitle = 'Bütçeyi gözden geçirmek ve harcamaları sınıflandırmak önemli.';
  }

  return { score, title, subtitle };
}
