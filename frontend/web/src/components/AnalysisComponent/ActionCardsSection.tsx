import { Lightbulb, Repeat } from 'lucide-react';
import type { BudgetSuggestionsResponseDto } from '@/types/budget';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionCardsSectionProps {
  budget: BudgetSuggestionsResponseDto | null;
}

export function ActionCardsSection({ budget }: ActionCardsSectionProps) {
  const suggestions = budget?.suggestions ?? [];
  const yemekish = suggestions.find(
    (s) =>
      /yemek|restoran|cafe|kahve|dışarı|dışarıda/i.test(s.categoryName) ||
      /yemek|restoran|cafe|kahve|dışarı|dışarıda/i.test(String(s.categoryName))
  );
  const pick = yemekish ?? suggestions[0];
  let savingsBody: string | null = null;
  if (pick && pick.suggestedAmount > 0 && pick.averageSpent > pick.suggestedAmount) {
    const diff = pick.averageSpent - pick.suggestedAmount;
    const rounded = Math.round(diff);
    savingsBody = `Önerilen aylık hedefe göre ${formatExpenseCategoryLabel(pick.categoryName)} kaleminde yaklaşık ₺${rounded.toLocaleString('tr-TR')} tasarruf alanı var. Dışarıda yemek yerine evde pişirmek bu tutarı güçlü biçimde etkileyebilir.`;
  } else if (pick) {
    savingsBody = `${formatExpenseCategoryLabel(pick.categoryName)} için model önerisi ${pick.suggestedAmount.toFixed(0)} TL; ortalama harcamanız ${pick.averageSpent.toFixed(0)} TL. Harcamayı önerilen seviyeye çekerek birikimi artırabilirsiniz.`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-primary/25 bg-primary/[0.06]">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lightbulb className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">Tasarruf potansiyeli</CardTitle>
            <CardDescription className="text-xs">Model + kategori önerileri</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {savingsBody ?? 'Yeterli kategori verisi oluştuğunda burada tahmini tasarruf alanları listelenecek.'}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.04]">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Repeat className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">Abonelik takibi</CardTitle>
            <CardDescription className="text-xs">Yakında</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          Düzenli ödemeler (streaming, yazılım, spor salonu vb.) otomatik tespit edilerek &quot;uzun süredir kullanılmayan
          abonelik&quot; uyarıları burada gösterilecek. Şimdilik işlemlerinizi kategori ve açıklama ile işaretlemeye devam
          edin.
        </CardContent>
      </Card>
    </div>
  );
}
