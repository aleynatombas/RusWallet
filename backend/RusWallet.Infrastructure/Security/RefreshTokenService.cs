using System.Security.Cryptography;
using System.Text;

namespace RusWallet.Infrastructure.Security;

public static class RefreshTokenService
{
    /// <summary>{userId}.{urlSafeRandom}</summary>
    public static string CreatePlainToken(int userId)
    {
        var random = RandomNumberGenerator.GetBytes(32);
        var part = Convert.ToBase64String(random).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return $"{userId}.{part}";
    }

    public static bool TryParseUserId(string? plainToken, out int userId)
    {
        userId = 0;
        if (string.IsNullOrWhiteSpace(plainToken)) return false;
        var dot = plainToken.IndexOf('.');
        if (dot <= 0) return false;
        return int.TryParse(plainToken.AsSpan(0, dot), out userId) && userId > 0;
    }

    public static string HashToken(string plainToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(plainToken));
        return Convert.ToHexString(hash);
    }

    public static bool TokensMatch(string plainToken, string? storedHashHex)
    {
        if (string.IsNullOrEmpty(storedHashHex)) return false;
        var computed = HashToken(plainToken);
        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(computed),
                Convert.FromHexString(storedHashHex));
        }
        catch
        {
            return false;
        }
    }
}
