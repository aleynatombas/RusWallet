namespace RusWallet.Core.DTOs.Prediction
{
    public class PredictionResponseDto
    {
        public decimal EstimatedAmount { get; set; }
        public DateTime PredictedMonth { get; set; }
        public string Message { get; set; }
    }
}