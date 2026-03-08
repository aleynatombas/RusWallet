namespace RusWallet.Core.DTOs.Finance
{
    /// <summary>Anomali uyarısı: alışılmadık yüksek/ düşük harcama (istatistik/ML).</summary>
    public class AnomalyAlertDto
    {
        public string CategoryName { get; set; } = null!;
        public int? CategoryId { get; set; }
        /// <summary>Bu dönemdeki harcama.</summary>
        public decimal CurrentAmount { get; set; }
        /// <summary>Geçmiş ortalaması.</summary>
        public decimal HistoricalAverage { get; set; }
        /// <summary>Geçmiş standart sapma.</summary>
        public decimal StandardDeviation { get; set; }
        /// <summary>Ortalamadan kaç standart sapma uzak (z-score).</summary>
        public double ZScore { get; set; }
        /// <summary>Yüksek = harcama ortalamadan belirgin şekilde fazla.</summary>
        public string Severity { get; set; } = null!;
        public string Message { get; set; } = null!;
        /// <summary>ML.NET Time Series (IID Spike) ile tespit edildi mi.</summary>
        public bool DetectedByML { get; set; }
    }

    public class AnomaliesResponseDto
    {
        public List<AnomalyAlertDto> Anomalies { get; set; } = new();
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public int MonthsCompared { get; set; }
        /// <summary>Anomali yoksa veya yetersiz veri varsa açıklama.</summary>
        public string? Message { get; set; }
    }
}
