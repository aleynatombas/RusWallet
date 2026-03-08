using RusWallet.Core.DTOs.Receipt;

namespace RusWallet.Core.Interfaces;

/// <summary>Fiş görselinden OCR/AI ile vendor, tarih ve toplam tutar çıkaran servis.</summary>
public interface IReceiptAnalysisService
{
    /// <summary>Görsel dosyadan metin çıkarır ve vendor, tarih, toplam tutarı parse eder.</summary>
    Task<ReceiptExtractionResultDto> ExtractFromImageAsync(Stream imageStream, string? fileName = null, CancellationToken cancellationToken = default);
}
