import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  type Location,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingGuard } from './components/OnboardingGuard';
import { MainLayout } from './components/MainLayout';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { BudgetPage } from './pages/BudgetPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';

function AppRoutes() {
  const location = useLocation();
  const background = (location.state as { background?: Location } | null)?.background;

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {background ? (
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<OnboardingGuard />}>
              <Route path="/onboarding" element={<OnboardingOverlay />} />
            </Route>
          </Route>
        </Routes>
      ) : null}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
