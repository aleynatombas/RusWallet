function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

/** Kart üstünde gösterilecek kısa özet (1–2 cümle). */
export function buildGoalCardNarrative(mainGoal: string, savingsTarget: number | null): string {
  const g = mainGoal.trim();
  const wantsSavings =
    /\bbirikim/i.test(g) || /\bbirik/i.test(g) || /\btasarruf/i.test(g) || savingsTarget != null;
  if (wantsSavings && savingsTarget != null && savingsTarget > 0) {
    return `Birikim odaklı bir hedefin var; tutarı ${fmtTry(savingsTarget)} olarak tanıtımda kayıtlı tutabilirsin — süre ve senaryolarda net kalır.`;
  }
  if (wantsSavings) {
    return `Metninde bir tutar geçiyorsa tanıtımda hedef tutarını netleştirebilirsin.`;
  }
  return `Bu ifadeyi referans alarak özetleri düşün; asistan sohbette de aynı bağlamı görür.`;
}
