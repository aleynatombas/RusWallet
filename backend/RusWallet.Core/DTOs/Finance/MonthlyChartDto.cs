namespace RusWallet.Core.DTOs.Finance;

/// <summary>Grafik için aylık veri noktası (bar/line chart).</summary>
public class MonthlyChartDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = null!; // örn. "2025-01"
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
    public decimal Balance => Income - Expense;
}
