'use client';
import { useAuth } from './AuthContext';
import LoginScreen from './LoginScreen';
import { ReactNode } from 'react';

export default function AppGuard({ children }: { children: ReactNode }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <h1>ZAPATERÍA JABIBI</h1>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
