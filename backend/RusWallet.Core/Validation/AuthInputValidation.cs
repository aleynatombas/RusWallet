using System.Net.Mail;
using System.Text.RegularExpressions;

namespace RusWallet.Core.Validation;

/// <summary>Kayıt, giriş ve şifre sıfırlama için ortak doğrulamalar.</summary>
public static class AuthInputValidation
{
    private static readonly Regex s_emailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    public static bool IsValidEmailFormat(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var t = email.Trim();
        if (t.Length < 5 || t.Length > 254) return false;
        if (!s_emailRegex.IsMatch(t)) return false;
        try
        {
            _ = new MailAddress(t);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>Şifre: en az 8 karakter; büyük, küçük, rakam ve özel karakter.</summary>
    public static bool TryValidatePassword(string? password, out string errorMessage)
    {
        errorMessage = "";
        if (string.IsNullOrEmpty(password))
        {
            errorMessage = "Şifre gerekli.";
            return false;
        }

        if (password.Length < 8)
        {
            errorMessage = "Şifre en az 8 karakter olmalıdır.";
            return false;
        }

        if (!password.Any(char.IsUpper))
        {
            errorMessage = "Şifre en az bir büyük harf içermelidir.";
            return false;
        }

        if (!password.Any(char.IsLower))
        {
            errorMessage = "Şifre en az bir küçük harf içermelidir.";
            return false;
        }

        if (!password.Any(char.IsDigit))
        {
            errorMessage = "Şifre en az bir rakam içermelidir.";
            return false;
        }

        const string special = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~\\\"";
        if (!password.Any(c => special.Contains(c)))
        {
            errorMessage = "Şifre en az bir özel karakter içermelidir (! @ # $ % vb.).";
            return false;
        }

        return true;
    }

    private static readonly Regex s_e164Regex = new(
        @"^\+[1-9]\d{7,14}$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    /// <summary>
    /// Telefon numarasını E.164 formatına normalize eder (örn. +905330888122). Boşluk, tire, parantez vb. kaldırılır.
    /// </summary>
    public static bool TryNormalizePhoneE164(string? phone, out string normalized, out string errorMessage)
    {
        normalized = "";
        errorMessage = "";

        if (string.IsNullOrWhiteSpace(phone))
        {
            errorMessage = "Telefon numarası gerekli.";
            return false;
        }

        var t = phone.Trim();
        // Boşluk, parantez, tire gibi karakterleri kaldır.
        t = Regex.Replace(t, @"[\s\-\(\)\.]+", "");

        if (!t.StartsWith("+", StringComparison.Ordinal))
        {
            errorMessage = "Telefon numarası ülke kodu ile başlamalı (örn. +90 533 088 8122).";
            return false;
        }

        if (!s_e164Regex.IsMatch(t))
        {
            errorMessage = "Telefon numarası geçersiz. Örnek: +90 533 088 8122";
            return false;
        }

        normalized = t;
        return true;
    }
}
