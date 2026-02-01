using System.Diagnostics.Contracts;

namespace RusWallet.Core.Entities{
public class Prediction
    {
        public int PredictionId {get; set;}
        public int UserId {get;set;}
        public decimal PredictedAmount {get; set;}
        public DateTime PredictedMonth {get;set;}
        public DateTime CreatedAt { get; set; }

        public User User { get; set; } // Navigation property for the user of this prediction

    }
}