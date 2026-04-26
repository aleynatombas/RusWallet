namespace RusWallet.Core.DTOs.Voice;

/// <summary>POST /api/Receipt/parse-voice (veya /api/Voice/parse) gövdesi: cihazda ses→metin sonrası metin.</summary>
public class VoiceParseRequestDto
{
    /// <summary>Kullanıcının söylediği cümle (örn. "bugün 150 liraya kahve aldım").</summary>
    public string Text { get; set; } = string.Empty;
}
