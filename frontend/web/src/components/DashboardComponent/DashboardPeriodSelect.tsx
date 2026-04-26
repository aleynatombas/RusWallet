import { ChevronDown } from 'lucide-react';
import type { DashboardPeriod } from '@/lib/dashboardPeriod';
import { DASHBOARD_PERIOD_OPTIONS } from '@/lib/dashboardPeriod';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DashboardPeriodSelectProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
  className?: string;
  id?: string;
}

export function DashboardPeriodSelect({ value, onChange, className, id = 'dashboard-period' }: DashboardPeriodSelectProps) {
  const current = DASHBOARD_PERIOD_OPTIONS.find((o) => o.value === value) ?? DASHBOARD_PERIOD_OPTIONS[0];

  return (
    <div className={cn('relative z-20 flex w-full shrink-0 justify-center sm:w-auto sm:justify-end', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="outline"
            size="sm"
            className={cn(
              'h-10 min-h-[2.5rem] w-full max-w-none justify-between gap-2 border border-primary/20 bg-primary/5 px-3 text-sm font-medium text-foreground shadow-none',
              'hover:border-primary/30 hover:bg-primary/10 hover:text-foreground',
              'focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2',
              'dark:border-primary/25 dark:bg-primary/10 dark:text-foreground dark:shadow-none',
              'dark:hover:border-primary/35 dark:hover:bg-primary/15 dark:hover:text-foreground',
              'sm:min-w-[11rem] sm:max-w-[min(100%,14rem)]'
            )}
            aria-label={`Özet dönemi: ${current.label}. Değiştirmek için tıklayın.`}
          >
            <span className="min-w-0 truncate text-left">{current.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-80" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-[100] min-w-[11rem] border-border bg-popover text-popover-foreground shadow-elevation-lg dark:shadow-md"
        >
          {DASHBOARD_PERIOD_OPTIONS.map((o) => (
            <DropdownMenuItem
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'cursor-pointer font-medium text-foreground focus:bg-accent focus:text-accent-foreground',
                value === o.value && 'bg-primary/10 text-foreground dark:bg-primary/15'
              )}
            >
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
