/**
 * API base URL – Web ile aynı backend (RusWallet.API).
 *
 * Fiziksel cihazda (Expo Go ile gerçek telefon) giriş yapamıyorsan:
 * Telefon "localhost" ile kendi kendine bakar, bilgisayarı bulamaz.
 * Aşağıdaki DEV_HOST'u bilgisayarının yerel IP'si yap (örn. 192.168.1.5).
 *
 * IP bulmak: Bilgisayarda PowerShell → ipconfig → "IPv4 Address" (Wi-Fi).
 *
 * Emülatör: localhost veya Android emülatörde 10.0.2.2
 */
const DEV_HOST = '192.168.1.31'; // Fiziksel cihazda burayı bilgisayar IP'si yap: '192.168.1.5'
const PORT = 5140;

export const API_BASE_URL =
  __DEV__
    ? `http://${DEV_HOST}:${PORT}`
    : 'http://localhost:5140'; // Production'da gerçek API URL'i yazılacak
