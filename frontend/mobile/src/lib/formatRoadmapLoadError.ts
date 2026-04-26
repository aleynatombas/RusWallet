import axios from 'axios';

export function formatRoadmapLoadError(reason: unknown): string {
  if (axios.isAxiosError(reason)) {
    if (!reason.response) {
      return 'Sunucuya ulaşılamıyor. Bağlantınızı veya API adresini kontrol edin.';
    }
    const s = reason.response.status;
    if (s === 401) {
      return 'Oturum gerekli veya süresi dolmuş; tekrar giriş yapın.';
    }
    if (s >= 500) {
      return 'Sunucu hatası. Daha sonra tekrar deneyin.';
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
