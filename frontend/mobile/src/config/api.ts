/**
 * API base URL – Web ile aynı backend (RusWallet.API).
 *
 * Ağ değişince (yeni Wi‑Fi, hotspot): bilgisayarda `ipconfig` → Wi‑Fi **IPv4** değerini
 * `DEV_HOST` olarak güncelle. Telefon tarayıcısından `http://<IP>:5140/swagger` açılmalı.
 *
 * - **Android emülatör:** `USE_ANDROID_EMULATOR = true` → bilgisayardaki API için `10.0.2.2`
 * - **Fiziksel Android veya iPhone (Expo Go):** `USE_ANDROID_EMULATOR = false` + `DEV_HOST` = PC’nin IPv4’ü (aynı Wi‑Fi). iOS’ta da `192.168.x.x:5140` kullanılır; Safari’den `http://<IP>:5140/swagger` deneyin.
 * - **Firewall:** Gerekirse Windows’ta TCP 5140 inbound izni
 */
const USE_ANDROID_EMULATOR = false;

/** Bilgisayarın yerel IP’si evin mesela (örn. 192.168.1.32). Emülatörde kullanılmaz. batu int 172.20.10.10 */
const DEV_HOST = '172.20.10.10';

const PORT = 5140;

function getDevBaseUrl(): string {
  if (USE_ANDROID_EMULATOR) {
    return `http://10.0.2.2:${PORT}`;
  }
  return `http://${DEV_HOST}:${PORT}`;
}

export const API_BASE_URL = __DEV__
  ? getDevBaseUrl()
  : 'http://localhost:5140'; // Release build: gerçek API URL’ini buraya yaz
