'use client';
import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('Ingrese al menos 4 dígitos');
      return;
    }
    setLoading(true);
    const result = await login(pin);
    if (!result.ok) {
      setError(result.error || 'PIN inválido');
      setPin('');
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <h1>ZAPATERÍA JABIBI</h1>
          <p>Sistema Administrativo</p>
        </div>

        <div className="login-pin-display">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
            <button
              key={i}
              className={`pin-key ${key === '⌫' ? 'pin-key-delete' : ''} ${key === '' ? 'pin-key-empty' : ''}`}
              onClick={() => {
                if (key === '⌫') handleDelete();
                else if (key !== '') handleDigit(key);
              }}
              disabled={key === '' || loading}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary login-submit"
          onClick={handleSubmit}
          disabled={pin.length < 4 || loading}
        >
          {loading ? 'Verificando...' : '🔓 Ingresar'}
        </button>
      </div>
    </div>
  );
}
