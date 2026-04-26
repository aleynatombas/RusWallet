using System.Globalization;
using System.Text.RegularExpressions;
using RusWallet.Core.DTOs.Receipt;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

/// <summary>
/// Türkçe doğal dil: rakam + lira/tl, "bugün/dün/yarın", gelir ipuçları; kalan metinden kısa işletme/açıklama.
/// </summary>
public class VoiceTransactionParser : IVoiceTransactionParser
{
    private static readonly Regex AmountNearMoney = new(
        @"(?<!\d)(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:lira(?:ya|yı|yi|da|de)?|tl|try|₺)?(?!\d)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(200));

    private static readonly Regex YearLike = new(@"^\d{4}$", RegexOptions.CultureInvariant);

    public ReceiptExtractionResultDto? TryParseTranscript(string transcript, out string? errorMessage)
    {
        errorMessage = null;
        if (string.IsNullOrWhiteSpace(transcript))
        {
            errorMessage = "Metin boş.";
            return null;
        }

        var text = transcript.Trim();
        var lower = text.ToLowerInvariant();

        var inferredDate = InferDate(lower);
        if (!TryPickAmount(text, out var amount, out var remainder))
        {
            errorMessage =
                "Tutar anlaşılamadı. Örnek: «Bugün 150 liraya kahve aldım» veya «45,50 TL otobüs».";
            return null;
        }

        var vendor = BuildVendorDescription(remainder);
        var incomeHint = InferIncomeHint(lower);

        return new ReceiptExtractionResultDto
        {
            TotalAmount = amount,
            VendorName = vendor,
            TransactionDate = inferredDate,
            IsIncome = incomeHint,
            RawText = text,
        };
    }

    private static DateTime InferDate(string lower)
    {
        if (lower.Contains("dün") || lower.Contains("dun"))
            return DateTime.Today.AddDays(-1).Date;
        if (lower.Contains("yarın") || lower.Contains("yarin"))
            return DateTime.Today.AddDays(1).Date;
        // bugün, bu gün veya belirtilmemiş → bugün
        return DateTime.Today.Date;
    }

    private static bool TryPickAmount(string original, out decimal amount, out string remainder)
    {
        amount = 0;
        remainder = original;
        decimal best = 0;
        Match? bestMatch = null;

        foreach (Match m in AmountNearMoney.Matches(original))
        {
            var raw = m.Groups[1].Value.Replace(',', '.');
            if (!decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var v))
                continue;
            if (v <= 0 || v >= 100_000_000) continue;
            if (YearLike.IsMatch(m.Groups[1].Value) && v is >= 2000 and <= 2100)
            {
                // "2024 model" gibi yıl; yine de 150 gibi kısa rakamlar geçer
                if (!lowerNeighborLooksLikeMoney(original, m.Index + m.Length))
                    continue;
            }

            if (v > best)
            {
                best = v;
                bestMatch = m;
            }
        }

        if (bestMatch is null || best <= 0)
            return false;

        amount = decimal.Round(best, 2, MidpointRounding.AwayFromZero);
        remainder = RemoveMatch(original, bestMatch);
        remainder = Regex.Replace(remainder, @"\s+", " ").Trim();
        return true;
    }

    private static bool lowerNeighborLooksLikeMoney(string original, int afterIndex)
    {
        if (afterIndex >= original.Length) return true;
        var rest = original.AsSpan(afterIndex).TrimStart();
        if (rest.Length == 0) return true;
        var head = rest[..Math.Min(12, rest.Length)].ToString().ToLowerInvariant();
        return head.StartsWith("lira", StringComparison.Ordinal)
               || head.StartsWith("tl", StringComparison.Ordinal)
               || head.StartsWith("try", StringComparison.Ordinal)
               || head.StartsWith("₺", StringComparison.Ordinal);
    }

    private static string RemoveMatch(string original, Match m)
    {
        var before = original[..m.Index].Trim();
        var after = original[(m.Index + m.Length)..].Trim();
        if (string.IsNullOrEmpty(before)) return after;
        if (string.IsNullOrEmpty(after)) return before;
        return before + " " + after;
    }

    private static bool InferIncomeHint(string lower)
    {
        string[] incomePhrases =
        {
            "maaş aldım", "maas aldim", "maaş yattı", "maas yatti", "maaşım geldi", "maasim geldi",
            "gelir olarak", "tahsilat", "müşteri ödedi", "musteri odedi", "freelance ödeme",
            "havale geldi", "eft geldi", "ödeme aldım", "odeme aldim", "kazanç elde", "kazanc elde",
        };
        return incomePhrases.Any(p => lower.Contains(p, StringComparison.Ordinal));
    }

    private static string BuildVendorDescription(string remainder)
    {
        var r = remainder;
        foreach (var w in new[] { "bugün", "bugun", "dün", "dun", "yarın", "yarin", "için", "icin", "bir", "şey", "sey" })
            r = Regex.Replace(r, $@"\b{Regex.Escape(w)}\b", " ", RegexOptions.IgnoreCase);

        r = Regex.Replace(r, @"\s+", " ").Trim();
        r = Regex.Replace(r, @"\b(aldım|aldim|ettim|harcadım|harcadim|ödedim|odedim)\b", " ", RegexOptions.IgnoreCase);
        r = Regex.Replace(r, @"\s+", " ").Trim();

        if (string.IsNullOrWhiteSpace(r))
            return "Sesli işlem";

        if (r.Length > 120)
            r = r[..120].Trim();
        return CultureInfo.GetCultureInfo("tr-TR").TextInfo.ToTitleCase(r.ToLowerInvariant());
    }
}
