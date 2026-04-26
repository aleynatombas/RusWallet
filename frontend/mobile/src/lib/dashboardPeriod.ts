import { getCurrentMonthRangeStrings } from './monthRange';

export type DashboardPeriod = 'thisMonth' | 'last3Months' | 'last6Months' | 'oneYear' | 'all';

export const DASHBOARD_PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'thisMonth', label: 'Bu ay' },
  { value: 'last3Months', label: 'Son 3 ay' },
  { value: 'last6Months', label: 'Son 6 ay' },
  { value: 'oneYear', label: '1 yıl' },
  { value: 'all', label: 'Tümü' },
];

/** İşlem listesi API URL’si (tarih aralığı veya period=all). */
export function getDashboardTransactionsUrl(period: DashboardPeriod): string {
  if (period === 'all') {
    return '/Transaction?period=all';
  }
  const { start, end } = getDashboardDateRange(period);
  return `/Transaction?start=${start}&end=${end}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Takvim tabanlı aralık: seçilen dönemin ilk günü — bu ayın son günü (dahil).
 * Web `dashboardPeriod.ts` ile aynı.
 */
export function getDashboardDateRange(period: Exclude<DashboardPeriod, 'all'>): { start: string; end: string } {
  if (period === 'thisMonth') {
    return getCurrentMonthRangeStrings();
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDayThisMonth = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${pad(m + 1)}-${pad(lastDayThisMonth)}`;

  let monthsBack = 0;
  if (period === 'last3Months') monthsBack = 2;
  else if (period === 'last6Months') monthsBack = 5;
  else if (period === 'oneYear') monthsBack = 11;

  const startDate = new Date(y, m - monthsBack, 1);
  const start = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-01`;
  return { start, end };
}

export type DashboardPeriodLabels = {
  incomeTitle: string;
  incomeSubtitle: string;
  expenseTitle: string;
  expenseSubtitle: string;
  donutTitle: string;
  donutCenterHint: string;
  donutEmptyCompact: string;
  donutEmptyFull: string;
  shortcutStatsLabel: string;
};

export function getDashboardPeriodLabels(period: DashboardPeriod): DashboardPeriodLabels {
  switch (period) {
    case 'thisMonth':
      return {
        incomeTitle: 'Bu ay gelir',
        incomeSubtitle: 'Bu ay kayıtlı gelirler',
        expenseTitle: 'Bu ay gider',
        expenseSubtitle: 'Bu ay kayıtlı giderler',
        donutTitle: 'Bu ay gider · kategorilere göre',
        donutCenterHint: 'Bu ay · tüm giderler',
        donutEmptyCompact: 'Bu ay gider yok.',
        donutEmptyFull: 'Henüz bu ay kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
        shortcutStatsLabel: 'Bu ay işlem',
      };
    case 'last3Months':
      return {
        incomeTitle: 'Son 3 ay gelir',
        incomeSubtitle: 'Son 3 ay kayıtlı gelirler',
        expenseTitle: 'Son 3 ay gider',
        expenseSubtitle: 'Son 3 ay kayıtlı giderler',
        donutTitle: 'Son 3 ay gider · kategorilere göre',
        donutCenterHint: 'Son 3 ay · tüm giderler',
        donutEmptyCompact: 'Bu dönemde gider yok.',
        donutEmptyFull: 'Seçilen dönemde kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
        shortcutStatsLabel: 'Son 3 ay işlem',
      };
    case 'last6Months':
      return {
        incomeTitle: 'Son 6 ay gelir',
        incomeSubtitle: 'Son 6 ay kayıtlı gelirler',
        expenseTitle: 'Son 6 ay gider',
        expenseSubtitle: 'Son 6 ay kayıtlı giderler',
        donutTitle: 'Son 6 ay gider · kategorilere göre',
        donutCenterHint: 'Son 6 ay · tüm giderler',
        donutEmptyCompact: 'Bu dönemde gider yok.',
        donutEmptyFull: 'Seçilen dönemde kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
        shortcutStatsLabel: 'Son 6 ay işlem',
      };
    case 'oneYear':
      return {
        incomeTitle: 'Son 12 ay gelir',
        incomeSubtitle: 'Son 12 ay kayıtlı gelirler',
        expenseTitle: 'Son 12 ay gider',
        expenseSubtitle: 'Son 12 ay kayıtlı giderler',
        donutTitle: 'Son 12 ay gider · kategorilere göre',
        donutCenterHint: 'Son 12 ay · tüm giderler',
        donutEmptyCompact: 'Bu dönemde gider yok.',
        donutEmptyFull: 'Seçilen dönemde kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
        shortcutStatsLabel: 'Son 12 ay işlem',
      };
    case 'all':
      return {
        incomeTitle: 'Tümü gelir',
        incomeSubtitle: 'Tüm kayıtlı gelirler',
        expenseTitle: 'Tümü gider',
        expenseSubtitle: 'Tüm kayıtlı giderler',
        donutTitle: 'Tümü gider · kategorilere göre',
        donutCenterHint: 'Tümü · giderler',
        donutEmptyCompact: 'Gider yok.',
        donutEmptyFull: 'Henüz kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
        shortcutStatsLabel: 'Tüm işlemler',
      };
    default: {
      const _exhaustive: never = period;
      void _exhaustive;
      return getDashboardPeriodLabels('thisMonth');
    }
  }
}
