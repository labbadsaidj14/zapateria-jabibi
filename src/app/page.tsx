'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface DashboardData {
  totalClientes: number;
  totalTickets: number;
  ticketsPendientes: number;
  ticketsListos: number;
  materialesBajos: number;
  ticketsRecientes: Array<{
    id: number;
    numero: string;
    cliente_nombre: string;
    descripcion_trabajo: string;
    estado: string;
    fecha_ingreso: string;
    total: number;
  }>;
  alertasStock: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    unidad: string;
    stock_minimo: number;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  const estadoClass = (estado: string) => {
    switch (estado) {
      case 'Recibido': return 'badge badge-recibido';
      case 'En proceso': return 'badge badge-en-proceso';
      case 'Listo': return 'badge badge-listo';
      case 'Entregado': return 'badge badge-entregado';
      default: return 'badge';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel de Control</h1>
            <p className="page-subtitle">Resumen general de Zapatería Jabibi</p>
          </div>
          <Link href="/tickets/nuevo" className="btn btn-primary">
            🎫 Nuevo Ticket
          </Link>
        </div>

        {data && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-value">{data.ticketsPendientes}</div>
                <div className="stat-label">Tickets Pendientes</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{data.ticketsListos}</div>
                <div className="stat-label">Listos para Entregar</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-value">{data.totalClientes}</div>
                <div className="stat-label">Clientes Registrados</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-value" style={data.materialesBajos > 0 ? { color: 'var(--danger)' } : {}}>
                  {data.materialesBajos}
                </div>
                <div className="stat-label">Materiales con Stock Bajo</div>
              </div>
            </div>

            {data.alertasStock.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                ⚠️ <strong>{data.alertasStock.length} material(es)</strong> por debajo del stock mínimo:&nbsp;
                {data.alertasStock.map(m => `${m.nombre} (${m.cantidad} ${m.unidad})`).join(', ')}
              </div>
            )}

            <div className="data-table-wrapper">
              <div className="table-header">
                <h3>Tickets Recientes</h3>
                <Link href="/tickets" className="btn btn-secondary btn-sm">Ver todos →</Link>
              </div>
              {data.ticketsRecientes.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Ticket</th>
                      <th>Cliente</th>
                      <th>Trabajo</th>
                      <th>Estado</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ticketsRecientes.map(t => (
                      <tr key={t.id}>
                        <td><Link href={`/ticket/${t.numero}`}><strong>{t.numero}</strong></Link></td>
                        <td>{t.cliente_nombre || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.descripcion_trabajo || '—'}
                        </td>
                        <td><span className={estadoClass(t.estado)}>{t.estado}</span></td>
                        <td>${t.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="icon">🎫</div>
                  <p>No hay tickets creados todavía</p>
                  <Link href="/tickets/nuevo" className="btn btn-primary">Crear primer ticket</Link>
                </div>
              )}
            </div>
          </>
        )}

        {!data && (
          <div className="empty-state">
            <p>Cargando datos...</p>
          </div>
        )}
      </main>
    </div>
  );
}
