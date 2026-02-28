using RusWallet.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RusWallet.Core.Interfaces
{
    public interface IPredictionRepository
    {
        Task AddAsync(Prediction prediction);
        Task<List<Prediction>> GetByUserIdAsync(int userId);
    }
}