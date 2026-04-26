using System.Globalization;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

public class PersonalizedChatAnswerService : IPersonalizedChatAnswerService
{
    private readonly ITransactionRepository _transactions;
    private readonly IFinanceAnalysisService _finance;

    public PersonalizedChatAnswerService(ITransactionRepository transactions, IFinanceAnalysisService finance)
    {
        _transactions = transactions;
        _finance = finance;
    }

    public async Task<ChatResponseDto?> TryAnswerAsync(int userId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return null;

        var lower = message.Trim().ToLowerInvariant();
        var tr = CultureInfo.GetCultureInfo("tr-TR");
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1);
        var label = today.ToString("MMMM yyyy", tr);

        var monthTx = await _transactions.GetByUserAndDateRangeAsync(userId, monthStart, monthEnd, null);
        var monthExpense = monthTx.Where(t => !t.IsIncome).Sum(t => t.Amount);
        var monthIncome = monthTx.Where(t => t.IsIncome).Sum(t => t.Amount);
        var monthNet = monthIncome - monthExpense;

        if (IsThisMonthExpense(lower))
        {
            var count = monthTx.Count(t => !t.IsIncome);
            var text = count == 0
                ? $"{label} döneminde henüz gider kaydı yok. Toplam harcamanız 0,00 ₺."
                : $"{label} içinde toplam {monthExpense:N2} ₺ harcadınız ({count} işlem).";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        if (IsThisMonthIncome(lower))
        {
            var count = monthTx.Count(t => t.IsIncome);
            var text = count == 0
                ? $"{label} döneminde henüz gelir kaydı yok."
                : $"{label} içinde toplam {monthIncome:N2} ₺ gelir kaydettiniz ({count} işlem).";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        if (IsThisMonthNet(lower))
        {
            var text =
                $"{label} özeti: gelir {monthIncome:N2} ₺, gider {monthExpense:N2} ₺; net {monthNet:N2} ₺.";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        if (IsAllTimeBalance(lower))
        {
            var s = await _finance.GetSummaryAsync(userId);
            var text =
                $"Kayıtlarınıza göre toplam gelir {s.TotalIncome:N2} ₺, toplam gider {s.TotalExpense:N2} ₺; bakiye {s.Balance:N2} ₺.";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        if (IsAllTimeExpense(lower))
        {
            var s = await _finance.GetSummaryAsync(userId);
            var text = $"Tüm zamanlar boyunca toplam gideriniz {s.TotalExpense:N2} ₺.";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        if (IsAllTimeIncome(lower))
        {
            var s = await _finance.GetSummaryAsync(userId);
            var text = $"Tüm zamanlar boyunca toplam geliriniz {s.TotalIncome:N2} ₺.";
            return new ChatResponseDto { Response = text, Source = "Personalized" };
        }

        return null;
    }

    private static bool HasThisMonthContext(string lower) =>
        lower.Contains("bu ay") || lower.Contains("şu ay") || lower.Contains("bu ayki") || lower.Contains("bu ayın");

    private static bool IsThisMonthExpense(string lower)
    {
        if (HasThisMonthContext(lower))
            return lower.Contains("harcad") || lower.Contains("harcama") || lower.Contains("gider")
                   || lower.Contains("harca") || lower.Contains("ödedim") || lower.Contains("çıktı")
                   || lower.Contains("çıkış");

        if (lower.Contains("geçen") || lower.Contains("gecen") || lower.Contains("önceki") || lower.Contains("onceki"))
            return false;
        if (lower.Contains("toplam") || lower.Contains("tüm zaman") || lower.Contains("tum zaman") || lower.Contains("hayatım") || lower.Contains("hayatim"))
            return false;
        return lower.Contains("ne kadar harcadım") || lower.Contains("ne kadar harcadim");
    }

    private static bool IsThisMonthIncome(string lower)
    {
        if (!HasThisMonthContext(lower))
            return false;
        return lower.Contains("gelir") || lower.Contains("kazand") || lower.Contains("aldım")
               || lower.Contains("kazanç") || lower.Contains("kazan");
    }

    private static bool IsThisMonthNet(string lower)
    {
        if (!HasThisMonthContext(lower))
            return false;
        if (IsThisMonthExpense(lower) || IsThisMonthIncome(lower))
            return false;
        return lower.Contains("net") || lower.Contains("kâr") || lower.Contains("kar ") || lower.Contains("zarar")
               || lower.Contains("fark") || lower.Contains("durum") || lower.Contains("özeti")
               || (lower.Contains("bakiye") && !lower.Contains("toplam"));
    }

    private static bool IsAllTimeBalance(string lower)
    {
        if (HasThisMonthContext(lower))
            return false;
        return lower.Contains("bakiyem") || lower.Contains("bakiye")
               || (lower.Contains("param") && (lower.Contains("ne kadar") || lower.Contains("var mı")))
               || lower.Contains("hesabım") || lower.Contains("toplam durum");
    }

    private static bool IsAllTimeExpense(string lower)
    {
        if (HasThisMonthContext(lower))
            return false;
        return (lower.Contains("toplam") || lower.Contains("tüm zaman") || lower.Contains("tüm zamanlar"))
               && (lower.Contains("harcad") || lower.Contains("gider") || lower.Contains("harcama"));
    }

    private static bool IsAllTimeIncome(string lower)
    {
        if (HasThisMonthContext(lower))
            return false;
        return (lower.Contains("toplam") || lower.Contains("tüm zaman") || lower.Contains("tüm zamanlar"))
               && (lower.Contains("gelir") || lower.Contains("kazand"));
    }
}
