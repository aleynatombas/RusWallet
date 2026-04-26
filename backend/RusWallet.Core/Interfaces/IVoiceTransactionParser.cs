using RusWallet.Core.DTOs.Receipt;

namespace RusWallet.Core.Interfaces;

/// <summary>Türkçe ses transkriptinden tutar, tarih ve kısa açıklama çıkarır.</summary>
public interface IVoiceTransactionParser
{
    /// <summary>Tutar bulunamazsa null döner.</summary>
    ReceiptExtractionResultDto? TryParseTranscript(string transcript, out string? errorMessage);
}
