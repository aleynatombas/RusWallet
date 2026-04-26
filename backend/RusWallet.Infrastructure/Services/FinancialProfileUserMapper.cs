using System.Text.Json;
using RusWallet.Core.DTOs.Onboarding;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Services;

/// <summary>
/// Tanıtım profilini <see cref="User.FinancialProfileJson"/> ile aynı kaynakta, sayısal sütunlarla da tutar (SSMS/rapor).
/// </summary>
internal static class FinancialProfileUserMapper
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public static UserFinancialProfilePayload FromUser(User user)
    {
        var p = DeserializeJson(user.FinancialProfileJson);
        if ((p.MonthlyIncomeNet is null || p.MonthlyIncomeNet <= 0) && user.MonthlyIncomeNet is decimal inc && inc > 0)
            p.MonthlyIncomeNet = inc;
        if ((p.MonthlyFixedCostsApprox is null || p.MonthlyFixedCostsApprox <= 0) &&
            user.MonthlyFixedCostsApprox is decimal fix && fix > 0)
            p.MonthlyFixedCostsApprox = fix;
        SyncComputedFixedTotal(p);
        return p;
    }

    public static void Assign(User user, UserFinancialProfilePayload profile)
    {
        SyncComputedFixedTotal(profile);
        user.FinancialProfileJson = JsonSerializer.Serialize(profile, JsonOpts);
        user.MonthlyIncomeNet = profile.MonthlyIncomeNet;
        user.MonthlyFixedCostsApprox = profile.MonthlyFixedCostsApprox;
    }

    /// <summary>Üç kalem de girildikten sonra (0 dahil) toplam sabit gider sütununu kira+fatura+abonelik toplamına eşitler.</summary>
    private static void SyncComputedFixedTotal(UserFinancialProfilePayload p)
    {
        if (!p.MonthlyRentApprox.HasValue || !p.MonthlyBillsApprox.HasValue || !p.MonthlySubscriptionsApprox.HasValue)
            return;
        p.MonthlyFixedCostsApprox = (p.MonthlyRentApprox ?? 0) + (p.MonthlyBillsApprox ?? 0) + (p.MonthlySubscriptionsApprox ?? 0);
    }

    private static UserFinancialProfilePayload DeserializeJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new UserFinancialProfilePayload();
        try
        {
            return JsonSerializer.Deserialize<UserFinancialProfilePayload>(json, JsonOpts)
                   ?? new UserFinancialProfilePayload();
        }
        catch
        {
            return new UserFinancialProfilePayload();
        }
    }
}
