namespace RusWallet.Core.DTOs.AI
{
    public class ChatResponseDto
    {
        public string Response { get; set; } = null!;
        /// <summary>Yanıtın kaynağı: "OpenAI" veya "FAQ" (hazır cevaplar). Hangi servisin kullanıldığını görmek için.</summary>
        public string? Source { get; set; }
    }
}
