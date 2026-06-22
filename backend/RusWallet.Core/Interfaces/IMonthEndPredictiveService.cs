using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Entities;

namespace RusWallet.Core.Interfaces;

/// <summary>ML.NET + geçmiş tempo oranları ile ay sonu ve gelecek ay gider tahmini.</summary>
public interface IMonthEndPredictiveService
{
    MonthEndPredictionResult Predict(
        IReadOnlyList<Transaction> expenses,
        DateTime today,
        User? user,
        Func<Transaction, bool> isFlexibleSpend);
}
