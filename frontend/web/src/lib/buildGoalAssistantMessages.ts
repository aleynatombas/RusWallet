function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

export interface GoalContextNumbers {
  balance: number;
  /** Kayıtlı veya metinden çıkarılan birikim hedefi */
  savingsTarget: number | null;
  monthlyIncomeNet: number | null;
  monthlyFixedCosts: number | null;
}

/** Sohbet kutusuna düşecek, hedef + sayılarla zengin ilk mesaj. */
export function buildGoalFocusedOpener(ctx: GoalContextNumbers, mainGoal: string): string {
  const parts: string[] = [];
  parts.push(`Profilimde kayıtlı hedefim: «${mainGoal.trim()}».`);

  if (ctx.savingsTarget != null && ctx.savingsTarget > 0) {
    parts.push(`Birikim için hedef tutarım yaklaşık ${fmtTry(ctx.savingsTarget)} olarak düşünüyorum.`);
  }

  parts.push(`Kayıtlarıma göre güncel bakiyem yaklaşık ${fmtTry(ctx.balance)}.`);

  if (ctx.monthlyIncomeNet != null && ctx.monthlyIncomeNet > 0) {
    parts.push(`Tanıtımda verdiğim tahmini aylık net gelir ${fmtTry(ctx.monthlyIncomeNet)}.`);
  }
  if (ctx.monthlyFixedCosts != null && ctx.monthlyFixedCosts > 0) {
    parts.push(`Tahmini sabit giderim ayda ${fmtTry(ctx.monthlyFixedCosts)}.`);
  }

  parts.push(
    'Bu hedefe göre harcamalarımı ve birikim ihtimalimi kısaca yorumlar mısın? Somut ama basit adımlar öner.'
  );

  return parts.join(' ');
}

export function buildGoalCommentaryPrompt(ctx: GoalContextNumbers, mainGoal: string): string {
  return buildGoalFocusedOpener(ctx, mainGoal);
}

export function buildGoalStepsPrompt(ctx: GoalContextNumbers, mainGoal: string): string {
  const g = mainGoal.trim();
  const tgt = ctx.savingsTarget != null && ctx.savingsTarget > 0 ? fmtTry(ctx.savingsTarget) : 'belirttiğim tutar';
  return (
    `Hedefim: «${g}». ${tgt !== 'belirttiğim tutar' ? `Birikim hedefim yaklaşık ${tgt}. ` : ''}` +
    `Bakiye ${fmtTry(ctx.balance)}. Bu hedefe ulaşmak için önümüzdeki 3 ay için somut, ölçülebilir 3 adım öner.`
  );
}

export function buildMonthlySavingsTimelinePrompt(
  monthlySaving: number,
  ctx: GoalContextNumbers,
  mainGoal: string
): string {
  const g = mainGoal.trim();
  const m = fmtTry(monthlySaving);
  const bal = ctx.balance;
  const tgt = ctx.savingsTarget;

  let rough = '';
  if (tgt != null && tgt > 0 && monthlySaving > 0) {
    const remaining = Math.max(0, tgt - bal);
    const approxMonths = remaining / monthlySaving;
    if (Number.isFinite(approxMonths) && approxMonths > 0) {
      rough = ` (Kabaca: bakiyemi bugünkü gibi sayarsak ~${approxMonths.toFixed(1)} ay, sadece bu sabit aylık birikimle.) `;
    }
  }

  return (
    `Hedefim: «${g}». ` +
    (tgt != null && tgt > 0 ? `Birikim hedef tutarım ${fmtTry(tgt)}. ` : '') +
    `Şu an kayıtlı bakiyem ${fmtTry(bal)}. Her ay düzenli **${m}** ayırırsam birikim hedefime ne kadar sürede yaklaşırım?${rough}` +
    ` İşlem ve gelir/gider kayıtlarımı da göz önüne alarak gerçekçi bir cevap ver.`
  );
}

/** Kart üstünde gösterilecek kısa özet (1–2 cümle). */
export function buildGoalCardNarrative(mainGoal: string, savingsTarget: number | null): string {
  const g = mainGoal.trim();
  const wantsSavings =
    /\bbirikim/i.test(g) || /\bbirik/i.test(g) || /\btasarruf/i.test(g) || savingsTarget != null;
  if (wantsSavings && savingsTarget != null && savingsTarget > 0) {
    return `Birikim odaklı bir hedefin var; tutarı **${fmtTry(savingsTarget)}** olarak kayda alabilirsin — böylece süre ve senaryo sorularında asistan net konuşur.`;
  }
  if (wantsSavings) {
    return `Metninde bir tutar geçiyorsa aşağıdan **hedef tutarını** netleştirip kaydedebilirsin; asistan buna göre kişiselleşir.`;
  }
  return `Bu ifadeyi referans alarak grafikleri ve önerileri düşün; asistan sohbette de aynı bağlamı görecek.`;
}
