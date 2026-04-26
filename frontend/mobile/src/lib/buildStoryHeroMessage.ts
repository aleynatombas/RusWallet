import { formatPersonNameSegment } from './formatDisplayName';

const HERO_WHEN_NO_EXPENSE_TODAY: ((name: string) => string)[] = [
  (n) => `Selam ${n}, hadi beraber bugünkü harcamayı netleştirelim!`,
  (n) => `Selam ${n}, hadi beraber eklemeden önce üzerinden bir geçelim!`,
  (n) => `Selam ${n}, hadi beraber finans özetine bir göz atalım!`,
  (n) => `Selam ${n}, hadi beraber ne ekleyeceğini konuşalım!`,
];

function pickHeroNoExpenseVariant(): number {
  const d = new Date();
  return (d.getDate() + d.getMonth() * 31 + d.getFullYear() * 367) % HERO_WHEN_NO_EXPENSE_TODAY.length;
}

export function buildStoryHeroMessage(
  firstName: string | null | undefined,
  todayExpenseTotal: number,
  todayExpenseCount: number
): string {
  const name = formatPersonNameSegment(firstName) || 'Merhaba';
  if (todayExpenseCount === 0) {
    return HERO_WHEN_NO_EXPENSE_TODAY[pickHeroNoExpenseVariant()](name);
  }
  if (todayExpenseTotal < 150) {
    return `Selam ${name}, bugün hafif gidiyorsun (${todayExpenseTotal.toFixed(0)} TL kayıtlı).`;
  }
  return `Selam ${name}, bugün ${todayExpenseTotal.toFixed(0)} TL harcama kaydı var; akşamı rahat kapatmak için bir göz at.`;
}
