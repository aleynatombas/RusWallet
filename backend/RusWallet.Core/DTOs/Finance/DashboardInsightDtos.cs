namespace RusWallet.Core.DTOs.Finance
{
    // ── Harcama alışkanlıklarım (bu ay, kategori dağılımı) ─────────────────

    public class SpendingHabitsInsightDto
    {
        /// <summary>"ready" | "insufficient_data" | "error".</summary>
        public string Status { get; set; } = "insufficient_data";
        public DataSufficiencyDto DataQuality { get; set; } = new();
        public string MonthLabel { get; set; } = "";
        /// <summary>Bu ay bugüne kadar toplam gider.</summary>
        public decimal TotalExpense { get; set; }
        /// <summary>Geçen ayın aynı gününe kadarki toplam gider (kıyaslanabilir dilim). Geçen ay kayıt yoksa null.</summary>
        public decimal? PreviousPeriodTotal { get; set; }
        public double? ChangeVsPreviousPercent { get; set; }
        /// <summary>Kıyas dönemi, ör. "1–15 Ekim".</summary>
        public string PreviousPeriodLabel { get; set; } = "";
        public int TransactionCount { get; set; }
        /// <summary>Kira, fatura, abonelik gibi zorunlu kalemlerin payı (%).</summary>
        public double FixedSharePercent { get; set; }
        public List<CategoryShareDto> Categories { get; set; } = new();
        public string? Commentary { get; set; }
        public string CommentarySource { get; set; } = "rule_based";
        public string Message { get; set; } = "";
    }

    public class CategoryShareDto
    {
        public string CategoryName { get; set; } = "";
        public decimal Amount { get; set; }
        public double SharePercent { get; set; }
        public decimal? PreviousAmount { get; set; }
        /// <summary>Geçen ayın aynı dönemine göre değişim; geçen ay bu kategoride harcama yoksa null.</summary>
        public double? ChangePercent { get; set; }
        public int TransactionCount { get; set; }
        public bool IsFixed { get; set; }
        /// <summary>İlk beşten sonraki kategoriler "Diğer" altında toplanır.</summary>
        public bool IsOther { get; set; }
    }

    // ── Son 6 ay finansal trend ────────────────────────────────────────────

    public class FinancialTrendInsightDto
    {
        public string Status { get; set; } = "insufficient_data";
        public DataSufficiencyDto DataQuality { get; set; } = new();
        /// <summary>Eskiden yeniye 6 ay; son eleman içinde bulunulan ay (kısmi).</summary>
        public List<TrendMonthDto> Months { get; set; } = new();
        /// <summary>Gelecek ay gider tahmini — Forecast.PredictedTotal ile aynı değer; tahmin hazır değilse null.</summary>
        public TrendForecastDto? Forecast { get; set; }
        public string? HighestExpenseMonthLabel { get; set; }
        public decimal? HighestExpenseMonthAmount { get; set; }
        /// <summary>Kaydı olan tamamlanmış ayların ortalama gideri.</summary>
        public decimal? AverageMonthlyExpense { get; set; }
        public decimal? AverageMonthlyIncome { get; set; }
        /// <summary>Son tamamlanmış ayın bir önceki aya göre gider değişimi.</summary>
        public double? LastCompleteMonthChangePercent { get; set; }
        public int MonthsWithData { get; set; }
        public int MonthsWithoutData { get; set; }
        public string? Commentary { get; set; }
        public string CommentarySource { get; set; } = "rule_based";
        public string Message { get; set; } = "";
    }

    public class TrendMonthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string Label { get; set; } = "";
        /// <summary>Bu ayda hiç kayıt yoksa false: grafik bu ayı sıfır değil, boş olarak gösterir.</summary>
        public bool HasData { get; set; }
        /// <summary>İçinde bulunulan ay (bugüne kadar).</summary>
        public bool IsPartial { get; set; }
        public decimal? Income { get; set; }
        public decimal? Expense { get; set; }
        public decimal? Net { get; set; }
        /// <summary>Bir önceki aya göre gider değişimi (kısmi ay için geçen ayın aynı dönemine göre).</summary>
        public double? ExpenseChangePercent { get; set; }
    }

    public class TrendForecastDto
    {
        public string Label { get; set; } = "";
        public decimal Expense { get; set; }
        public decimal? Lower { get; set; }
        public decimal? Upper { get; set; }
    }
}
