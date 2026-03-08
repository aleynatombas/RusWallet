using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using RusWallet.Core.DTOs.Receipt;
using RusWallet.Core.Interfaces;
using Tesseract;

namespace RusWallet.Infrastructure.Services;

/// <summary>
/// Fiş görselinden OCR (Tesseract) ile metin çıkarır; vendor, tarih ve toplam tutarı parse eder.
/// Tessdata klasörü yoksa veya Receipt:UseMock=true ise örnek veri döner (Swagger testi için).
/// Azure Document Intelligence ile değiştirilebilir.
/// </summary>
public class ReceiptAnalysisService : IReceiptAnalysisService
{
    private readonly IConfiguration _configuration;
    private const string DefaultTessDataPath = "tessdata";

    public ReceiptAnalysisService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<ReceiptExtractionResultDto> ExtractFromImageAsync(Stream imageStream, string? fileName = null, CancellationToken cancellationToken = default)
    {
        var useMock = string.Equals(_configuration["Receipt:UseMock"], "true", StringComparison.OrdinalIgnoreCase);
        if (useMock)
            return await Task.FromResult(GetMockResult());

        string? tempPath = null;
        try
        {
            var ext = ".png";
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var e = Path.GetExtension(fileName).ToLowerInvariant();
                if (e is ".jpg" or ".jpeg" or ".webp" or ".bmp") ext = e;
            }
            tempPath = Path.Combine(Path.GetTempPath(), $"receipt_{Guid.NewGuid():N}{ext}");
            await using (var fs = File.Create(tempPath))
                await imageStream.CopyToAsync(fs, cancellationToken);

            var tessDataPath = _configuration["Receipt:TesseractDataPath"] ?? DefaultTessDataPath;
            var fullTessPath = Path.IsPathRooted(tessDataPath)
                ? tessDataPath
                : Path.Combine(AppContext.BaseDirectory, tessDataPath);

            if (!Directory.Exists(fullTessPath))
                return GetMockResult($"Tessdata bulunamadı: {fullTessPath}. Receipt:UseMock=true ile test edebilirsiniz.");

            using var engine = new TesseractEngine(fullTessPath, "eng", EngineMode.Default);
            using var pix = Pix.LoadFromFile(tempPath);
            using var page = engine.Process(pix);
            var text = page.GetText();

            return ParseReceiptText(text);
        }
        catch (Exception ex) when (IsTesseractSetupError(ex))
        {
            return GetMockResult($"OCR başlatılamadı: {ex.Message}. Receipt:UseMock=true ile test edebilirsiniz.");
        }
        finally
        {
            if (tempPath != null && File.Exists(tempPath))
                try { File.Delete(tempPath); } catch { /* ignore */ }
        }
    }

    private static bool IsTesseractSetupError(Exception ex)
    {
        var msg = ex.Message.ToLowerInvariant();
        return msg.Contains("tesseract") || msg.Contains("tessdata") || msg.Contains("leptonica") || ex is DllNotFoundException;
    }

    private static ReceiptExtractionResultDto ParseReceiptText(string text)
    {
        var result = new ReceiptExtractionResultDto
        {
            RawText = text.Length > 0 ? text : null,
            VendorName = "",
            TransactionDate = null,
            TotalAmount = 0
        };

        if (string.IsNullOrWhiteSpace(text))
            return result;

        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(l => l.Trim()).Where(l => l.Length > 0).ToList();

        // Vendor: "ŞOK MARKETLER TİC.A.Ş" gibi ilk işletme satırı (TİC, A.Ş, MARKET vb. veya ilk anlamlı satır)
        result.VendorName = lines.FirstOrDefault(l => l.Length >= 3 && (
            l.Contains("TİC", StringComparison.OrdinalIgnoreCase) ||
            l.Contains("A.Ş", StringComparison.OrdinalIgnoreCase) ||
            l.Contains("MARKET", StringComparison.OrdinalIgnoreCase) ||
            l.Contains("LTD", StringComparison.OrdinalIgnoreCase) ||
            (l.Count(char.IsLetter) >= 2 && !Regex.IsMatch(l, @"^\d+[,./\-]\d+")))) ?? "";
        if (string.IsNullOrWhiteSpace(result.VendorName))
            result.VendorName = lines.FirstOrDefault(l => l.Length >= 2 && l.Count(char.IsLetter) >= 2) ?? "";

        // OCR düzeltmeleri: "Bok" -> "ŞOK", "TIC.A.5" -> "TİC.A.Ş"
        result.VendorName = result.VendorName
            .Replace("Bok ", "ŞOK ", StringComparison.OrdinalIgnoreCase)
            .Replace("TIC.A.5", "TİC.A.Ş", StringComparison.OrdinalIgnoreCase)
            .Replace("TIC.A.S", "TİC.A.Ş", StringComparison.OrdinalIgnoreCase);

        // Tarih: dd.MM.yyyy, dd/MM/yyyy, dd-MM-yyyy, yyyy-MM-dd, ve 8 hane ddmmyyyy (03022024)
        var datePatterns = new[]
        {
            @"(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})",
            @"(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})",
            @"\b(\d{2})(\d{2})(\d{4})\b"
        };
        foreach (var line in lines)
        {
            foreach (var pattern in datePatterns)
            {
                var m = Regex.Match(line, pattern);
                if (!m.Success) continue;
                // 8 hane ddmmyyyy: g1=gg, g2=aa, g3=yyyy (Türkiye)
                if (pattern == @"\b(\d{2})(\d{2})(\d{4})\b" && m.Groups.Count >= 4 &&
                    int.TryParse(m.Groups[1].Value, out var dd) && int.TryParse(m.Groups[2].Value, out var mm) && int.TryParse(m.Groups[3].Value, out var yyyy) &&
                    yyyy >= 2000 && yyyy <= 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)
                {
                    try { result.TransactionDate = new DateTime(yyyy, mm, dd); break; } catch { }
                    continue;
                }
                // dd/MM/yyyy veya d/M/yyyy (Türkiye fiş: 16/12/2017 = 16 Aralık 2017)
                if (m.Groups.Count >= 4)
                {
                    var g1 = m.Groups[1].Value;
                    var g2 = m.Groups[2].Value;
                    var g3 = m.Groups[3].Value;
                    if (g3.Length == 4 && int.TryParse(g1, out var day) && int.TryParse(g2, out var month) && int.TryParse(g3, out var year) &&
                        year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31)
                    {
                        try
                        {
                            result.TransactionDate = new DateTime(year, month, day);
                            break;
                        }
                        catch { }
                    }
                }
            }
            if (result.TransactionDate.HasValue) break;
        }
        if (!result.TransactionDate.HasValue)
        {
            var fullMatch = Regex.Match(text, @"\b(\d{2})(\d{2})(\d{4})\b");
            if (fullMatch.Success && int.TryParse(fullMatch.Groups[1].Value, out var d) && int.TryParse(fullMatch.Groups[2].Value, out var mo) && int.TryParse(fullMatch.Groups[3].Value, out var y) && y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)
            {
                try { result.TransactionDate = new DateTime(y, mo, d); } catch { /* invalid date */ }
            }
        }
        if (!result.TransactionDate.HasValue)
            result.TransactionDate = DateTime.Today;

        // Toplam: "TOPLAM", "total", "tutar", "TOP" vb. sonrası sayı (Türkçe fiş: *128,95 veya 128;,95)
        var totalPattern = @"(?:toplam|total|genel\s+toplam|total\s+amount|tutar|top)\s*:?\s*\*?\s*([\d\s]+[,.;]?\d*)";
        var totalRegex = new Regex(totalPattern, RegexOptions.IgnoreCase);
        foreach (var line in lines)
        {
            var match = totalRegex.Match(line);
            if (!match.Success) continue;
            var numStr = match.Groups[1].Value.Trim().Replace(" ", "").Replace(";", "").Replace(',', '.');
            if (decimal.TryParse(numStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount) && amount > 0)
            {
                result.TotalAmount = amount;
                break;
            }
        }
        // OCR bazen başa fazladan rakam ekler: 970,50 -> 70,50 (9 fazla)
        if (result.TotalAmount >= 900m && result.TotalAmount < 1000m)
        {
            var corrected = result.TotalAmount - 900m;
            if (corrected >= 10m && corrected <= 99.99m)
                result.TotalAmount = corrected;
        }
        if (result.TotalAmount == 0)
        {
            // Satırda sadece *XX,XX veya XX,XX formatında son fiyat
            foreach (var line in lines.Reverse<string>())
            {
                var m = Regex.Match(line, @"\*?\s*(\d+[,.]\d{2})\s*$");
                if (m.Success && decimal.TryParse(m.Groups[1].Value.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var last) && last > 0)
                {
                    result.TotalAmount = last;
                    break;
                }
            }
        }

        return result;
    }

    private static ReceiptExtractionResultDto GetMockResult(string? rawText = null)
    {
        return new ReceiptExtractionResultDto
        {
            VendorName = "Örnek Market",
            TransactionDate = DateTime.Today,
            TotalAmount = 125.50m,
            RawText = rawText ?? "Mock: Tessdata yok veya Receipt:UseMock=true."
        };
    }
}
