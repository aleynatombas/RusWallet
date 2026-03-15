import { useNavigate } from 'react-router-dom';
import { AuthComponent } from '../components/AuthComponent';

export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <AuthComponent mode="register" onSuccess={() => navigate('/', { replace: true })} />
    </div>
  );
}
