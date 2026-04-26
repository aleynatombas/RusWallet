/**
 * Paper `theme.colors.*` çoğunlukla `rgb(r, g, b)`; web ile aynı teal üzerinden yarı saydam arka planlar için.
 */
export function themeColorAlpha(color: string, alpha: number): string {
  const t = color.trim();
  const m = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
  const h = t.match(/^#([0-9a-fA-F]{6})$/i);
  if (h) {
    const n = parseInt(h[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
