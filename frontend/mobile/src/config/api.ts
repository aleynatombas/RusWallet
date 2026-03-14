/**
 * API base URL – Web ile aynı backend (RusWallet.API).
 * Emülatör: localhost veya Android için 10.0.2.2
 * Fiziksel cihaz: Bilgisayarın IP'si (örn. http://192.168.1.x:5140)
 */
export const API_BASE_URL = __DEV__
  ? 'http://localhost:5140'
  : 'http://localhost:5140'; // Production'da gerçek API URL'i yazılacak
