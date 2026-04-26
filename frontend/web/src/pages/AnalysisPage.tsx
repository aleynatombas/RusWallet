import { AnalysisComponent } from '@/components/AnalysisComponent';

/**
 * Analizlerim — içerik AnalysisComponent içinde.
 */
export function AnalysisPage() {
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col overflow-x-hidden bg-background max-lg:min-h-min lg:h-full lg:min-h-0">
      <AnalysisComponent />
    </div>
  );
}
