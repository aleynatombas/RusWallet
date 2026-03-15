/**
 * AnalysisComponent – Tarih filtresi + grafik üretimi (diyagram: React Web UI Components)
 * API Interface: GET /api/analysis/* (özet, bütçe önerisi, anomali)
 */
export function AnalysisComponent() {
  return (
    <div className="max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium text-gray-800">Finansal Analiz</h2>
      <p className="mt-2 text-sm text-gray-500">Tarih filtresi ve grafikler sonraki adımda eklenecek.</p>
    </div>
  );
}
