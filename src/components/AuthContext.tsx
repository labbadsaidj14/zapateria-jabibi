'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Usuario {
  id: number;
  nombre: string;
  rol: 'admin' | 'usuario';
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session
    const saved = localStorage.getItem('jabibi_usuario');
    if (saved) {
      try {
        setUsuario(JSON.parse(saved));
      } catch {
        localStorage.removeItem('jabibi_usuario');
      }
    }
    setLoading(false);
  }, []);

  const login = async (pin: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error || 'PIN inválido' };
      }

      const data = await res.json();
      const user: Usuario = { id: data.id, nombre: data.nombre, rol: data.rol };
      setUsuario(user);
      localStorage.setItem('jabibi_usuario', JSON.stringify(user));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('jabibi_usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, isAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
