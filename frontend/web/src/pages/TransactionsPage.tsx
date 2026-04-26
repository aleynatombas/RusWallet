import { TransactionsPanel } from '@/components/TransactionsPanel';

export function TransactionsPage() {
  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
      <TransactionsPanel />
    </div>
  );
}
