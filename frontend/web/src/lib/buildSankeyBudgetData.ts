import type { CategorySlice } from '@/lib/groupExpenseByCategory';

export interface SankeyBudgetPayload {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
  /** Tıklanınca korelasyon notu için sağ sütun adları */
  expenseNames: Set<string>;
}

/**
 * Gelir kaynakları → Ana bütçe → Gider kategorileri (Recharts Sankey).
 */
export function buildSankeyBudgetData(
  incomeSlices: CategorySlice[],
  expenseSlices: CategorySlice[]
): SankeyBudgetPayload | null {
  const inFlow = incomeSlices.filter((s) => s.value > 0);
  const exFlow = expenseSlices.filter((s) => s.value > 0);
  if (inFlow.length === 0 || exFlow.length === 0) return null;

  const incomeNodes = inFlow.map((s) => ({ name: `${s.name} (gelir)` }));
  const budgetNode = { name: 'Ana bütçe' };
  const expenseNodes = exFlow.map((s) => ({ name: s.name }));

  const nodes = [...incomeNodes, budgetNode, ...expenseNodes];
  const budgetIdx = incomeNodes.length;

  const links: { source: number; target: number; value: number }[] = [];
  for (let i = 0; i < inFlow.length; i++) {
    links.push({ source: i, target: budgetIdx, value: inFlow[i].value });
  }
  for (let j = 0; j < exFlow.length; j++) {
    links.push({ source: budgetIdx, target: budgetIdx + 1 + j, value: exFlow[j].value });
  }

  return {
    nodes,
    links,
    expenseNames: new Set(exFlow.map((s) => s.name)),
  };
}
