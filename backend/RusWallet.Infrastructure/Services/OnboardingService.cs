using System.Globalization;
using System.Text.RegularExpressions;
using RusWallet.Core.DTOs.Onboarding;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

public class OnboardingService : IOnboardingService
{
    /// <summary>İşlem listesinde profil kökenini ayırt etmek ve çift eklemeyi önlemek için.</summary>
    private const string ProfileIncomeTxMarker = "[Profil] Onboarding — tahmini aylık net gelir";

    /// <summary>Eski tek satır sabit gider (geriye dönük).</summary>
    private const string ProfileFixedTxMarker = "[Profil] Onboarding — tahmini sabit giderler";

    private const string ProfileRentTxMarker = "[Profil] Onboarding — tahmini kira";
    private const string ProfileBillsTxMarker = "[Profil] Onboarding — tahmini faturalar";
    private const string ProfileSubscriptionsTxMarker = "[Profil] Onboarding — tahmini abonelikler";

    private static readonly string[] StepPrompts =
    [
        "Aylık **net gelirin** yaklaşık ne kadar? Sayı yazman yeterli.",
        "**Kira** giderin ayda yaklaşık kaç TL? (Yoksa **0** yaz.)",
        "**Faturalar** için ayda toplam yaklaşık ne kadar? (Yoksa **0**.)",
        "**Abonelikler** için ayda toplam yaklaşık kaç TL? (Yoksa **0**.)",
        "**Finansal hedefin ne?** **Sadece yazılı anlat; rakam veya tutar yazma.** Bu hedef için **TL tutarını** bir sonraki adımda soracağım.",
        "Bu hedef için ne kadar para biriktirmen gerekiyor?",
    ];

    /// <summary>Son adım indeksi (0–3: sayı; 4: hedef metni; 5: hedef tutarı; tamamlanır).</summary>
    private const int LastStepIndex = 5;

    private readonly IUserRepository _users;
    private readonly ITransactionRepository _transactions;
    private readonly ICategoryService _categories;

    public OnboardingService(IUserRepository users, ITransactionRepository transactions, ICategoryService categories)
    {
        _users = users;
        _transactions = transactions;
        _categories = categories;
    }

    public async Task<OnboardingStateDto> GetStateAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");

        if (user.OnboardingCompletedAt == null && user.OnboardingStepIndex > LastStepIndex)
        {
            var legacy = FinancialProfileUserMapper.FromUser(user);
            user.OnboardingCompletedAt = DateTime.UtcNow;
            user.OnboardingStepIndex = LastStepIndex;
            FinancialProfileUserMapper.Assign(user, legacy);
            await _users.UpdateAsync(user);
            await EnsureProfileBaselineTransactionsAsync(user.UserId, legacy);
            return new OnboardingStateDto
            {
                Completed = true,
                StepIndex = LastStepIndex,
                AssistantMessage = string.Empty,
                Profile = legacy,
                SummaryLines = BuildSummaryLines(legacy),
            };
        }

        if (user.OnboardingCompletedAt != null)
        {
            var profile = FinancialProfileUserMapper.FromUser(user);
            if (!FinancialColumnsMatchProfile(user, profile))
            {
                FinancialProfileUserMapper.Assign(user, profile);
                await _users.UpdateAsync(user);
            }

            await EnsureProfileBaselineTransactionsAsync(user.UserId, profile);
            return new OnboardingStateDto
            {
                Completed = true,
                StepIndex = LastStepIndex,
                AssistantMessage = string.Empty,
                Profile = profile,
                SummaryLines = BuildSummaryLines(profile),
            };
        }

        var step = Math.Clamp(user.OnboardingStepIndex, 0, LastStepIndex);
        return new OnboardingStateDto
        {
            Completed = false,
            StepIndex = step,
            AssistantMessage = StepPrompts[step],
            Profile = FinancialProfileUserMapper.FromUser(user),
            SummaryLines = null,
        };
    }

    public async Task<OnboardingAnswerResponseDto> PostAnswerAsync(int userId, string message)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");

        if (user.OnboardingCompletedAt != null)
        {
            return new OnboardingAnswerResponseDto
            {
                AssistantReply = "Finans tanıtımını zaten tamamlamıştın. Ayarlardan profilini güncelleyebilirsin.",
                Completed = true,
                NextStepIndex = LastStepIndex,
                Profile = FinancialProfileUserMapper.FromUser(user),
                SummaryLines = BuildSummaryLines(FinancialProfileUserMapper.FromUser(user)),
            };
        }

        var step = Math.Clamp(user.OnboardingStepIndex, 0, LastStepIndex);
        var profile = FinancialProfileUserMapper.FromUser(user);

        if (step is 0 or 1 or 2 or 3 or 5)
        {
            if (!IsAmountExpressionOnly(message))
            {
                return new OnboardingAnswerResponseDto
                {
                    AssistantReply =
                        "Bu adımda sadece **tutar** yaz (rakam ve varsa **bin / milyon / k** gibi). Açıklama veya harf ekleme.",
                    Completed = false,
                    NextStepIndex = step,
                    Profile = profile,
                    SummaryLines = null,
                };
            }

            if (!TryParseOnboardingAmount(message, out var amount))
            {
                return new OnboardingAnswerResponseDto
                {
                    AssistantReply =
                        "Bu tutarı sayı olarak anlayamadım. Tutarı rakamla veya **0** yazmayı dene.",
                    Completed = false,
                    NextStepIndex = step,
                    SummaryLines = null,
                };
            }

            switch (step)
            {
                case 0:
                    profile.MonthlyIncomeNet = amount;
                    break;
                case 1:
                    profile.MonthlyRentApprox = amount;
                    break;
                case 2:
                    profile.MonthlyBillsApprox = amount;
                    break;
                case 3:
                    profile.MonthlySubscriptionsApprox = amount;
                    break;
                case 5:
                    profile.SavingsTargetAmount = amount > 0 ? amount : null;
                    break;
            }

            FinancialProfileUserMapper.Assign(user, profile);
            user.OnboardingStepIndex = step + 1;

            if (user.OnboardingStepIndex > LastStepIndex)
                return await CompleteAndSaveAsync(user, profile);

            await _users.UpdateAsync(user);
            return new OnboardingAnswerResponseDto
            {
                AssistantReply = AckForStep(step),
                Completed = false,
                NextStepIndex = user.OnboardingStepIndex,
                Profile = profile,
                AssistantMessageFollowUp = StepPrompts[user.OnboardingStepIndex],
            };
        }

        // Serbest metin: hedef açıklaması (adım 4) — sadece rakam kabul edilmez
        var text = (message ?? "").Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return new OnboardingAnswerResponseDto
            {
                AssistantReply = "Kısa da olsa bir şey yazarsan devam edebilirim.",
                Completed = false,
                NextStepIndex = step,
                Profile = profile,
                SummaryLines = null,
            };
        }

        var forGoalLetterCheck = Regex.Replace(text, @"\s*(tl|try|₺|lira)\s*", "", RegexOptions.IgnoreCase).Trim();
        if (Regex.IsMatch(forGoalLetterCheck, @"^[\d\s\.\,]+$"))
        {
            return new OnboardingAnswerResponseDto
            {
                AssistantReply =
                    "**Finansal hedefin ne?** **Sadece yazılı anlat; rakam veya tutar yazma.** Bu hedef için **TL tutarını** bir sonraki adımda soracağım.",
                Completed = false,
                NextStepIndex = step,
                Profile = profile,
                SummaryLines = null,
            };
        }

        if (!Regex.IsMatch(forGoalLetterCheck, @"\p{L}"))
        {
            return new OnboardingAnswerResponseDto
            {
                AssistantReply =
                    "Hedefini en az birkaç harfle yazılı anlat; emoji veya sadece sembol yeterli olmayabilir.",
                Completed = false,
                NextStepIndex = step,
                Profile = profile,
                SummaryLines = null,
            };
        }

        if (step != 4)
        {
            return new OnboardingAnswerResponseDto
            {
                AssistantReply = "Beklenmeyen adım. Sayfayı yenileyip tekrar dene.",
                Completed = false,
                NextStepIndex = step,
                Profile = profile,
                SummaryLines = null,
            };
        }

        profile.MainGoal = text.Length > 2000 ? text[..2000] : text;
        FinancialProfileUserMapper.Assign(user, profile);
        user.OnboardingStepIndex = step + 1;

        if (user.OnboardingStepIndex > LastStepIndex)
            return await CompleteAndSaveAsync(user, profile);

        await _users.UpdateAsync(user);
        return new OnboardingAnswerResponseDto
        {
            AssistantReply = AckForStep(step),
            Completed = false,
            NextStepIndex = user.OnboardingStepIndex,
            Profile = profile,
            AssistantMessageFollowUp = StepPrompts[user.OnboardingStepIndex],
        };
    }

    public async Task SkipAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");

        user.OnboardingCompletedAt = DateTime.UtcNow;
        user.OnboardingStepIndex = 0;
        var skipProfile = FinancialProfileUserMapper.FromUser(user);
        FinancialProfileUserMapper.Assign(user, skipProfile);
        await _users.UpdateAsync(user);
        await EnsureProfileBaselineTransactionsAsync(userId, skipProfile);
    }

    public async Task ReopenAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");

        user.OnboardingCompletedAt = null;
        user.OnboardingStepIndex = 0;
        if (string.IsNullOrWhiteSpace(user.FinancialProfileJson))
            FinancialProfileUserMapper.Assign(user, new UserFinancialProfilePayload());
        await _users.UpdateAsync(user);
    }

    public async Task AbortReopenAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");
        if (user.OnboardingCompletedAt != null)
            return;
        user.OnboardingCompletedAt = DateTime.UtcNow;
        user.OnboardingStepIndex = LastStepIndex;
        if (string.IsNullOrWhiteSpace(user.FinancialProfileJson))
            FinancialProfileUserMapper.Assign(user, new UserFinancialProfilePayload());
        await _users.UpdateAsync(user);
        var profile = FinancialProfileUserMapper.FromUser(user);
        await EnsureProfileBaselineTransactionsAsync(userId, profile);
    }

    public async Task<OnboardingStateDto> PatchProfileAsync(int userId, OnboardingProfilePatchDto patch)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Kullanıcı bulunamadı.");

        var profile = FinancialProfileUserMapper.FromUser(user);

        if (patch.MainGoal != null)
        {
            var g = patch.MainGoal.Trim();
            profile.MainGoal = g.Length == 0 ? null : (g.Length > 2000 ? g[..2000] : g);
        }

        if (patch.SavingsTargetAmount.HasValue)
        {
            var v = patch.SavingsTargetAmount.Value;
            profile.SavingsTargetAmount = v <= 0 ? null : Math.Round(v, 2);
        }

        FinancialProfileUserMapper.Assign(user, profile);
        await _users.UpdateAsync(user);

        if (user.OnboardingCompletedAt != null)
            await EnsureProfileBaselineTransactionsAsync(userId, profile);

        return await GetStateAsync(userId);
    }

    public async Task SyncProfileBaselinesAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user == null || user.OnboardingCompletedAt == null) return;
        var profile = FinancialProfileUserMapper.FromUser(user);
        await EnsureProfileBaselineTransactionsAsync(userId, profile);
    }

    private async Task<OnboardingAnswerResponseDto> CompleteAndSaveAsync(User user, UserFinancialProfilePayload profile)
    {
        user.OnboardingCompletedAt = DateTime.UtcNow;
        user.OnboardingStepIndex = LastStepIndex;
        FinancialProfileUserMapper.Assign(user, profile);
        await _users.UpdateAsync(user);
        await EnsureProfileBaselineTransactionsAsync(user.UserId, profile);

        var lines = BuildSummaryLines(profile);
        return new OnboardingAnswerResponseDto
        {
            AssistantReply =
                "Teşekkürler! Net gelirin ve girdiğin kira / faturalar / abonelik tutarları bu ay için **Kira**, **Faturalar**, **Abonelikler** kategorilerinde gider işlemi olarak kaydedildi (güncellersen tutarlar buna göre güncellenir). **Bakiye** gelirlerden giderlerin düşülmüş halidir. Ana sayfada özetlenir; fiş ve işlemlerle güncellenir.",
            Completed = true,
            NextStepIndex = LastStepIndex,
            Profile = profile,
            SummaryLines = lines,
        };
    }

    private static bool FinancialColumnsMatchProfile(User user, UserFinancialProfilePayload p) =>
        Nullable.Compare(user.MonthlyIncomeNet, p.MonthlyIncomeNet) == 0
        && Nullable.Compare(user.MonthlyFixedCostsApprox, p.MonthlyFixedCostsApprox) == 0;

    private static string AckForStep(int stepCompleted) => stepCompleted switch
    {
        0 => "Gelirini not aldım. Şimdi **kira** tutarına bakalım.",
        1 => "Kira tutarını not aldım. **Faturalar** için devam edelim.",
        2 => "Faturaları not aldım. **Abonelikler** toplamına geçelim.",
        3 => "Hedefini not aldım.",
        4 => "Hedef tutarını not aldım.",
        _ => "Tamamdır.",
    };

    private static List<string> BuildSummaryLines(UserFinancialProfilePayload? p)
    {
        if (p == null)
            return new List<string> { "Henüz profil özeti yok." };

        var lines = new List<string>();
        if (p.MonthlyIncomeNet is decimal mInc && mInc > 0)
            lines.Add($"Net gelir: **{mInc:N0} ₺**");
        if (p.MonthlyRentApprox is decimal mr && mr > 0)
            lines.Add($"Kira: **{mr:N0} ₺** / ay");
        if (p.MonthlyBillsApprox is decimal mb && mb > 0)
            lines.Add($"Faturalar: **{mb:N0} ₺** / ay");
        if (p.MonthlySubscriptionsApprox is decimal ms && ms > 0)
            lines.Add($"Abonelikler: **{ms:N0} ₺** / ay");
        var hasSplitFixed =
            (p.MonthlyRentApprox ?? 0) > 0 || (p.MonthlyBillsApprox ?? 0) > 0 || (p.MonthlySubscriptionsApprox ?? 0) > 0;
        if (!hasSplitFixed && p.MonthlyFixedCostsApprox is decimal mFix && mFix > 0)
            lines.Add($"Sabit giderler: **{mFix:N0} ₺** / ay");
        if (!string.IsNullOrWhiteSpace(p.MainGoal))
            lines.Add($"Hedef: {p.MainGoal}");
        if (p.SavingsTargetAmount is decimal st && st > 0)
            lines.Add($"Hedef tutarı: **{st:N0} ₺**");

        return lines.Count > 0
            ? lines
            : new List<string> { "Profilini zamanla fiş ve işlemlerle zenginleştireceğiz." };
    }

    /// <summary>
    /// Tutar adımlarında rakam, ayraç, boşluk, ₺ ve sondaki bin/milyon/milyar/k dışında harf/emoticon yok mu.
    /// </summary>
    private static bool IsAmountExpressionOnly(string message)
    {
        var s = message.Trim();
        if (string.IsNullOrEmpty(s)) return false;

        s = Regex.Replace(s, @"\s*(tl|try|₺|lira)\s*", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\s+", " ");
        s = TrimTrailingNoise(s);

        const string binWord = @"[Bb][ıiİI][Nn]";
        for (var guard = 0; guard < 8; guard++)
        {
            s = TrimTrailingNoise(s);
            var before = s;
            if (Regex.IsMatch(s, @"milyar\s*$", RegexOptions.IgnoreCase))
                s = Regex.Replace(s, @"\s*milyar\s*$", "", RegexOptions.IgnoreCase).TrimEnd();
            else if (Regex.IsMatch(s, @"milyon\s*$", RegexOptions.IgnoreCase))
                s = Regex.Replace(s, @"\s*milyon\s*$", "", RegexOptions.IgnoreCase).TrimEnd();
            else if (Regex.IsMatch(s, $@"(?<=\d){binWord}\s*$", RegexOptions.IgnoreCase)
                     || Regex.IsMatch(s, $@"\s+{binWord}\s*$", RegexOptions.IgnoreCase))
                s = Regex.Replace(s, $@"(?<=\d){binWord}\s*$|\s+{binWord}\s*$", "", RegexOptions.IgnoreCase).TrimEnd();
            else if (Regex.IsMatch(s, @"(?<=\d)k\s*$", RegexOptions.IgnoreCase))
                s = Regex.Replace(s, @"(?<=\d)k\s*$", "", RegexOptions.IgnoreCase).TrimEnd();
            else
                break;

            if (s == before) break;
        }

        s = Regex.Replace(s, @"(?<=\d)\s+(?=\d)", "");
        s = Regex.Replace(s, @"[\d\s\.\,₺]", "");
        return s.Length == 0;
    }

    /// <summary>
    /// Onboarding tutarı: "450 bin", "1,5 milyon", "450k", "450 000" (ayraç) ve klasik sayı yazımını anlar.
    /// </summary>
    private static bool TryParseOnboardingAmount(string text, out decimal amount)
    {
        amount = 0;
        if (string.IsNullOrWhiteSpace(text)) return false;

        var s = text.Trim();
        s = Regex.Replace(s, @"\s*(tl|try|₺|lira)\s*", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\s+", " ");
        s = TrimTrailingNoise(s);

        if (!TryStripTrailingMultiplier(ref s, out var multiplier))
            multiplier = 1;

        // Rakamlar arası boşluk: "450 000" → "450000"
        s = Regex.Replace(s, @"(?<=\d)\s+(?=\d)", "");
        s = s.Trim();
        if (string.IsNullOrEmpty(s)) return false;

        foreach (Match m in Regex.Matches(s, @"\d[\d\.\,]*"))
        {
            if (!TryNormalizeDecimalString(m.Value, out var normalized)) continue;
            if (!decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var v))
                continue;
            if (v < 0) continue;
            var total = v * multiplier;
            if (total >= 0 && total < 1_000_000_000_000m)
            {
                amount = total;
                return true;
            }
        }

        return false;
    }

    /// <summary>Sondaki nokta/boşluk vb. "20 bin." sonunda çarpanı gizleyebiliyordu; kaldırır (ondalık "1,5" korunur).</summary>
    private static string TrimTrailingNoise(string s)
    {
        s = s.TrimEnd();
        while (s.Length > 0)
        {
            var c = s[^1];
            if (char.IsWhiteSpace(c) || c is '.' or '!' or '?' or ';' or ':' or '…' or ',' or '،')
            {
                s = s[..^1].TrimEnd();
                continue;
            }
            break;
        }
        return s;
    }

    /// <summary>bin / bın (klavye), milyon, milyar, k (×1000).</summary>
    private static bool TryStripTrailingMultiplier(ref string s, out decimal multiplier)
    {
        multiplier = 1;
        s = TrimTrailingNoise(s);
        var t = s;
        string? stripped = null;
        decimal mult = 1;

        // Türkçe "bin": i veya ı; boşluklu "20 bin", yapışık "20bin", noktalı "20 bin." TrimTrailingNoise sonrası
        const string binWord = @"[Bb][ıiİI][Nn]";

        if (Regex.IsMatch(t, @"milyar\s*$", RegexOptions.IgnoreCase))
        {
            mult = 1_000_000_000;
            stripped = Regex.Replace(s, @"\s*milyar\s*$", "", RegexOptions.IgnoreCase);
        }
        else if (Regex.IsMatch(t, @"milyon\s*$", RegexOptions.IgnoreCase))
        {
            mult = 1_000_000;
            stripped = Regex.Replace(s, @"\s*milyon\s*$", "", RegexOptions.IgnoreCase);
        }
        else if (Regex.IsMatch(t, $@"(?<=\d){binWord}\s*$", RegexOptions.IgnoreCase)
                 || Regex.IsMatch(t, $@"\s+{binWord}\s*$", RegexOptions.IgnoreCase))
        {
            mult = 1000;
            stripped = Regex.Replace(s, $@"(?<=\d){binWord}\s*$|\s+{binWord}\s*$", "", RegexOptions.IgnoreCase);
        }
        else if (Regex.IsMatch(t, @"(?<=\d)k\s*$", RegexOptions.IgnoreCase))
        {
            mult = 1000;
            stripped = Regex.Replace(s, @"(?<=\d)k\s*$", "", RegexOptions.IgnoreCase);
        }

        if (stripped == null) return false;
        s = TrimTrailingNoise(stripped);
        multiplier = mult;
        return true;
    }

    private static bool TryNormalizeDecimalString(string raw, out string normalized)
    {
        normalized = "";
        if (string.IsNullOrEmpty(raw)) return false;

        if (raw.Contains(',') && raw.Contains('.'))
            normalized = raw.Replace(".", "").Replace(",", ".");
        else if (raw.Contains(','))
        {
            var parts = raw.Split(',');
            if (parts.Length == 2 && parts[1].Length <= 2)
                normalized = parts[0].Replace(".", "") + "." + parts[1];
            else
                normalized = raw.Replace(",", "").Replace(".", "");
        }
        else if (raw.Contains('.'))
        {
            var segments = raw.Split('.');
            if (segments.Length > 1 && segments[^1].Length == 3 && segments.All(x => x.All(char.IsDigit)))
                normalized = raw.Replace(".", "");
            else
                normalized = raw.Replace(",", "");
        }
        else
            normalized = raw;

        return !string.IsNullOrEmpty(normalized);
    }

    /// <summary>UI ile aynı takvim ayı (TR) hizasında baseline tarihi; sunucu UTC iken DateTime.Today sapmasını önler.</summary>
    private static DateTime GetBaselineCalendarToday()
    {
        foreach (var id in new[] { "Europe/Istanbul", "Turkey Standard Time" })
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(id);
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
            }
            catch (TimeZoneNotFoundException)
            {
                // sıradaki id
            }
        }

        return DateTime.UtcNow.Date;
    }

    /// <summary>
    /// Profildeki net gelir ve sabit gider tahminlerini bu ay için kategori + işlem olarak yazar veya günceller.
    /// Tanıtımı ilk kez tamamlayan veya sohbetle güncelleyen kullanıcı için tutarlar veritabanıyla senkron kalır.
    /// </summary>
    private async Task EnsureProfileBaselineTransactionsAsync(int userId, UserFinancialProfilePayload profile)
    {
        var today = GetBaselineCalendarToday();
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthEndExclusive = monthStart.AddMonths(1);

        await UpsertIncomeBaselineAsync(userId, monthStart, monthEndExclusive, profile);

        var hasAnySplit =
            (profile.MonthlyRentApprox ?? 0) > 0 || (profile.MonthlyBillsApprox ?? 0) > 0 ||
            (profile.MonthlySubscriptionsApprox ?? 0) > 0;

        if (hasAnySplit)
        {
            await DeleteBaselineByMarkerAsync(userId, monthStart, monthEndExclusive, ProfileFixedTxMarker, isIncome: false);
            await UpsertExpenseBaselineAsync(userId, monthStart, monthEndExclusive, profile.MonthlyRentApprox,
                ProfileRentTxMarker, "Kira");
            await UpsertExpenseBaselineAsync(userId, monthStart, monthEndExclusive, profile.MonthlyBillsApprox,
                ProfileBillsTxMarker, "Faturalar");
            await UpsertExpenseBaselineAsync(userId, monthStart, monthEndExclusive, profile.MonthlySubscriptionsApprox,
                ProfileSubscriptionsTxMarker, "Abonelikler");
        }
        else
        {
            await DeleteBaselineByMarkerAsync(userId, monthStart, monthEndExclusive, ProfileRentTxMarker, isIncome: false);
            await DeleteBaselineByMarkerAsync(userId, monthStart, monthEndExclusive, ProfileBillsTxMarker, isIncome: false);
            await DeleteBaselineByMarkerAsync(userId, monthStart, monthEndExclusive, ProfileSubscriptionsTxMarker,
                isIncome: false);

            if (profile.MonthlyFixedCostsApprox is decimal fix && fix > 0)
                await UpsertLegacyFixedBaselineAsync(userId, monthStart, monthEndExclusive, fix);
            else
                await DeleteBaselineByMarkerAsync(userId, monthStart, monthEndExclusive, ProfileFixedTxMarker, isIncome: false);
        }
    }

    private async Task UpsertIncomeBaselineAsync(
        int userId,
        DateTime monthStart,
        DateTime monthEndExclusive,
        UserFinancialProfilePayload profile)
    {
        var inMonth = await _transactions.GetByUserAndDateRangeAsync(userId, monthStart, monthEndExclusive, null);
        var existing = inMonth.FirstOrDefault(t =>
            t.IsIncome && t.Description.StartsWith(ProfileIncomeTxMarker, StringComparison.Ordinal));

        if (profile.MonthlyIncomeNet is decimal inc && inc > 0)
        {
            var catId = await _categories.GetOrCreateCategoryIdAsync(userId, "Maaş", true);
            if (existing != null)
            {
                if (existing.Amount != inc || existing.CategoryId != catId)
                {
                    existing.Amount = inc;
                    existing.CategoryId = catId;
                    existing.TransactionDate = monthStart;
                    await _transactions.UpdateAsync(existing);
                }
            }
            else
            {
                await _transactions.AddAsync(new Transaction
                {
                    UserId = userId,
                    Amount = inc,
                    Description = ProfileIncomeTxMarker,
                    TransactionDate = monthStart,
                    IsIncome = true,
                    CategoryId = catId,
                });
            }
        }
        else if (existing != null)
        {
            await _transactions.DeleteAsync(existing.TransactionId);
        }
    }

    private async Task UpsertExpenseBaselineAsync(
        int userId,
        DateTime monthStart,
        DateTime monthEndExclusive,
        decimal? amountApprox,
        string descriptionMarker,
        string categoryName)
    {
        var inMonth = await _transactions.GetByUserAndDateRangeAsync(userId, monthStart, monthEndExclusive, null);
        var existing = inMonth.FirstOrDefault(t =>
            !t.IsIncome && t.Description.StartsWith(descriptionMarker, StringComparison.Ordinal));

        if (amountApprox is decimal a && a > 0)
        {
            var catId = await _categories.GetOrCreateCategoryIdAsync(userId, categoryName, false);
            if (existing != null)
            {
                if (existing.Amount != a || existing.CategoryId != catId)
                {
                    existing.Amount = a;
                    existing.CategoryId = catId;
                    existing.TransactionDate = monthStart;
                    await _transactions.UpdateAsync(existing);
                }
            }
            else
            {
                await _transactions.AddAsync(new Transaction
                {
                    UserId = userId,
                    Amount = a,
                    Description = descriptionMarker,
                    TransactionDate = monthStart,
                    IsIncome = false,
                    CategoryId = catId,
                });
            }
        }
        else if (existing != null)
        {
            await _transactions.DeleteAsync(existing.TransactionId);
        }
    }

    private async Task UpsertLegacyFixedBaselineAsync(
        int userId,
        DateTime monthStart,
        DateTime monthEndExclusive,
        decimal amount)
    {
        var inMonth = await _transactions.GetByUserAndDateRangeAsync(userId, monthStart, monthEndExclusive, null);
        var existing = inMonth.FirstOrDefault(t =>
            !t.IsIncome && t.Description.StartsWith(ProfileFixedTxMarker, StringComparison.Ordinal));
        var catId = await _categories.GetOrCreateCategoryIdAsync(userId, "Faturalar", false);

        if (existing != null)
        {
            if (existing.Amount != amount || existing.CategoryId != catId)
            {
                existing.Amount = amount;
                existing.CategoryId = catId;
                existing.TransactionDate = monthStart;
                await _transactions.UpdateAsync(existing);
            }
        }
        else
        {
            await _transactions.AddAsync(new Transaction
            {
                UserId = userId,
                Amount = amount,
                Description = ProfileFixedTxMarker,
                TransactionDate = monthStart,
                IsIncome = false,
                CategoryId = catId,
            });
        }
    }

    private async Task DeleteBaselineByMarkerAsync(
        int userId,
        DateTime monthStart,
        DateTime monthEndExclusive,
        string marker,
        bool isIncome)
    {
        var inMonth = await _transactions.GetByUserAndDateRangeAsync(userId, monthStart, monthEndExclusive, null);
        foreach (var t in inMonth
                     .Where(t => t.IsIncome == isIncome && t.Description.StartsWith(marker, StringComparison.Ordinal))
                     .ToList())
            await _transactions.DeleteAsync(t.TransactionId);
    }
}
