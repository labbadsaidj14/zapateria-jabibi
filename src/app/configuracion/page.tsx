'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Config {
  nombre_negocio: string;
  telefono: string;
  direccion: string;
  prefijo_ticket: string;
  visitas_frecuente: number;
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Config>({
    nombre_negocio: 'Zapatería Jabibi',
    telefono: '',
    direccion: '',
    prefijo_ticket: 'JAB-',
    visitas_frecuente: 5,
  });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    fetch('/api/configuracion').then(r => r.json()).then(setConfig);
  }, []);

  const guardar = async () => {
    await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Datos del negocio que aparecen en los tickets</p>
          </div>
        </div>

        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            {guardado && (
              <div className="alert" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)' }}>
                ✅ Configuración guardada correctamente
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre del Negocio</label>
              <input className="form-input" value={config.nombre_negocio} onChange={e => setConfig({ ...config, nombre_negocio: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={config.telefono} onChange={e => setConfig({ ...config, telefono: e.target.value })} placeholder="0412-1234567" />
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <textarea className="form-textarea" value={config.direccion} onChange={e => setConfig({ ...config, direccion: e.target.value })} placeholder="Dirección completa del negocio" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prefijo del Ticket</label>
                <input className="form-input" value={config.prefijo_ticket} onChange={e => setConfig({ ...config, prefijo_ticket: e.target.value })} placeholder="JAB-" />
              </div>
              <div className="form-group">
                <label className="form-label">Visitas para ser Frecuente</label>
                <input className="form-input" type="number" value={config.visitas_frecuente} onChange={e => setConfig({ ...config, visitas_frecuente: parseInt(e.target.value) || 5 })} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={guardar} style={{ marginTop: 8 }}>
              💾 Guardar Configuración
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
