/**
 * DashboardComponent – Bütçe kartları + grafikler (diyagram: React Web UI Components)
 * API Interface üzerinden finansal özet verisi alınır.
 */
import { useAuth } from '../../context/AuthContext';

export function DashboardComponent() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">RusWallet – Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Çıkış
          </button>
        </div>
      </div>
      <p className="text-gray-600">Hoş geldin, {user?.firstName} {user?.lastName}. Bütçe kartları ve grafikler burada (API bağlandığında dolu olacak).</p>
    </div>
  );
}
