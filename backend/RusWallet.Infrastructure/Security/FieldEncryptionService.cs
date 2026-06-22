using System.Security.Cryptography;
using System.Text;
using System.Globalization;

namespace RusWallet.Infrastructure.Security
{
    /// <summary>
    /// AES-256-CBC ile hassas finansal alan şifreleme / çözme hizmeti.
    /// Anahtar Program.cs'te Initialize() ile appsettings'ten yüklenir;
    /// EF Core Value Converter'lar bu servisi kullanarak okuma/yazmayı şeffaf yapar.
    /// </summary>
    public static class FieldEncryptionService
    {
        private static byte[]? _key;

        /// <summary>
        /// Uygulamanın başında çağrılmalı. appsettings'teki herhangi uzunluktaki
        /// ham anahtar metni SHA-256 ile 32 bayta (AES-256) normalize edilir.
        /// </summary>
        public static void Initialize(string rawKey)
        {
            if (string.IsNullOrWhiteSpace(rawKey))
                throw new InvalidOperationException("Encryption:Key appsettings'te tanımlanmamış.");
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        }

        public static bool IsInitialized => _key is not null;

        private static byte[] KeyBytes =>
            _key ?? throw new InvalidOperationException(
                "FieldEncryptionService başlatılmamış. Program.cs'te Initialize() çağrısı yapılmadı.");

        // ──────────────────────────────────────────────────────────────────────
        // Temel şifreleme / çözme  (string → string, Base64 çıktı)
        // ──────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Düz metni AES-256-CBC ile şifreler.
        /// Çıktı formatı: Base64( rastgele-IV(16 bayt) || CipherText )
        /// </summary>
        public static string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = KeyBytes;
            aes.GenerateIV();

            using var ms = new MemoryStream();
            ms.Write(aes.IV, 0, aes.IV.Length);          // 16 bayt IV başa yaz

            using (var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs, Encoding.UTF8))
                sw.Write(plainText);

            return Convert.ToBase64String(ms.ToArray());
        }

        /// <summary>Base64( IV(16) || CipherText ) formatındaki veriyi çözer.
        /// Eğer değer geçerli bir Base64 şifreli veri değilse (migration öncesi eski veri)
        /// orijinal değeri olduğu gibi döndürür.</summary>
        public static string Decrypt(string cipherBase64)
        {
            try
            {
                var data = Convert.FromBase64String(cipherBase64);
                if (data.Length <= 16) return cipherBase64; // IV bile sığmıyor — eski veri
                using var aes = Aes.Create();
                aes.Key = KeyBytes;
                var iv = new byte[16];
                Buffer.BlockCopy(data, 0, iv, 0, 16);
                aes.IV = iv;
                using var ms = new MemoryStream(data, 16, data.Length - 16);
                using var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
                using var sr = new StreamReader(cs, Encoding.UTF8);
                return sr.ReadToEnd();
            }
            catch
            {
                // Eski plaintext veri veya bozuk kayıt — olduğu gibi döndür
                return cipherBase64;
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // decimal yardımcıları  (EF Core Value Converter'lar için)
        // ──────────────────────────────────────────────────────────────────────

        public static string EncryptDecimal(decimal value) =>
            Encrypt(value.ToString(CultureInfo.InvariantCulture));

        public static decimal DecryptDecimal(string cipherBase64)
        {
            var plain = Decrypt(cipherBase64);
            return decimal.TryParse(plain, NumberStyles.Any, CultureInfo.InvariantCulture, out var result)
                ? result
                : 0m;
        }

        // ──────────────────────────────────────────────────────────────────────
        // Nullable decimal yardımcıları
        // ──────────────────────────────────────────────────────────────────────

        public static string? EncryptNullableDecimal(decimal? value) =>
            value.HasValue ? EncryptDecimal(value.Value) : null;

        public static decimal? DecryptNullableDecimal(string? cipherBase64) =>
            cipherBase64 is not null ? DecryptDecimal(cipherBase64) : null;

        // ──────────────────────────────────────────────────────────────────────
        // Nullable string yardımcıları
        // ──────────────────────────────────────────────────────────────────────

        public static string? EncryptNullableString(string? value) =>
            value is not null ? Encrypt(value) : null;

        public static string? DecryptNullableString(string? cipherBase64) =>
            cipherBase64 is not null ? Decrypt(cipherBase64) : null;
    }
}
