import axios from 'axios';

/** GET /Analysis/roadmap başarısız olunca kullanıcıya anlaşılır Türkçe açıklama */
export function formatRoadmapLoadError(reason: unknown): string {
  if (axios.isAxiosError(reason)) {
    if (!reason.response) {
      return 'Sunucuya ulaşılamıyor. Backend’in çalıştığından emin olun (geliştirmede Vite, /api isteklerini http://localhost:5140 adresine yönlendirir).';
    }
    const s = reason.response.status;
    if (s === 404) {
      return 'Bu özellik için API güncel değil: GET /api/Analysis/roadmap yok. Projeyi derleyip API’yi yeniden başlatın.';
    }
    if (s === 401) {
      return 'Oturum gerekli veya süresi dolmuş; tekrar giriş yapın.';
    }
    if (s >= 500) {
      return 'Sunucu hatası. API konsolundaki istisnayı kontrol edin (veritabanı bağlantısı vb.).';
    }
    const data = reason.response.data;
    const fromBody =
      data && typeof data === 'object' && 'message' in data && typeof (data as { message?: string }).message === 'string'
        ? (data as { message: string }).message
        : null;
    return fromBody || reason.message || 'Öngörü yüklenemedi.';
  }
  if (reason instanceof Error) return reason.message;
  return 'Öngörü ve yol haritası şu an yüklenemedi.';
}
