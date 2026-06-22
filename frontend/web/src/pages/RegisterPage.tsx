import { useNavigate } from 'react-router-dom';
import { AuthComponent } from '../components/AuthComponent';
import { AuthShell } from '@/components/auth/AuthShell';

export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <AuthShell activeTab="register">
      <AuthComponent
        mode="register"
        variant="split"
        onSuccess={() => navigate('/', { replace: true })}
      />
    </AuthShell>
  );
}
