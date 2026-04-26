using System.Globalization;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

public class ChatUserFinancialContext : IChatUserFinancialContext
{
    private readonly ITransactionRepository _transactions;
    private readonly IFinanceAnalysisService _finance;
    private readonly IUserRepository _users;

    public ChatUserFinancialContext(
        ITransactionRepository transactions,
        IFinanceAnalysisService finance,
        IUserRepository users)
    {
        _transactions = transactions;
        _finance = finance;
        _users = users;
    }

    public async Task<string> BuildSummaryAsync(int userId)
    {
        var tr = CultureInfo.GetCultureInfo("tr-TR");
        var summary = await _finance.GetSummaryAsync(userId);
        var today = DateTime.Today;
        var start = new DateTime(today.Year, today.Month, 1);
        var end = start.AddMonths(1);
        var monthTx = await _transactions.GetByUserAndDateRangeAsync(userId, start, end, null);
        var monthExpense = monthTx.Where(t => !t.IsIncome).Sum(t => t.Amount);
        var monthIncome = monthTx.Where(t => t.IsIncome).Sum(t => t.Amount);
        var monthNet = monthIncome - monthExpense;
        var label = today.ToString("MMMM yyyy", tr);

        var sb =
            $"Tüm zamanlar: toplam gelir {summary.TotalIncome:N2} ₺, toplam gider {summary.TotalExpense:N2} ₺, bakiye {summary.Balance:N2} ₺. " +
            $"Bu ay ({label}): gelir {monthIncome:N2} ₺, gider {monthExpense:N2} ₺, net {monthNet:N2} ₺.";

        var u = await _users.GetByIdAsync(userId);
        if (u == null)
            return sb;
        var profile = FinancialProfileUserMapper.FromUser(u);
        if (string.IsNullOrWhiteSpace(profile.MainGoal)
            && profile.MonthlyIncomeNet is not > 0
            && profile.MonthlyFixedCostsApprox is not > 0
            && profile.SavingsTargetAmount is not > 0)
            return sb;

        if (!string.IsNullOrWhiteSpace(profile.MainGoal))
            sb += $" Kayıtlı hedef ifadesi: «{profile.MainGoal}».";
        if (profile.SavingsTargetAmount is decimal st && st > 0)
            sb += $" Kayıtlı birikim hedef tutarı: {st:N0} ₺.";
        if (profile.MonthlyIncomeNet is decimal inc && inc > 0)
            sb += $" Profildeki tahmini aylık net gelir: {inc:N0} ₺.";
        if (profile.MonthlyFixedCostsApprox is decimal fix && fix > 0)
            sb += $" Profildeki tahmini sabit gider: {fix:N0} ₺/ay.";

        return sb;
    }
}
