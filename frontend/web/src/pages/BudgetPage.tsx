import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';

export function BudgetPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pb-8 lg:min-h-0 lg:overflow-hidden">
      <div>
        <h1 className={PAGE_TITLE_CLASS}>{formatPageTitleDisplay('Bütçem')}</h1>
        <p className="mt-1 text-muted-foreground">Limitler, uyarılar ve öneriler (yakında).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bütçe planı</CardTitle>
          <CardDescription>
            Kategori bazlı limitler ve bütçe aşımı bildirimleri bu alanda görüntülenecek.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Henüz yapılandırılmış bütçe yok. API hazır olduğunda burada listelenecek.
        </CardContent>
      </Card>
    </div>
  );
}
