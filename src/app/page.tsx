'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { generarRecordatorioWhatsApp } from '@/lib/whatsapp';

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
  recordatorios: Array<{
    id: number;
    numero: string;
    descripcion_zapato: string;
    fecha_entrega: string;
    fecha_ingreso: string;
    total: number;
    totalPagado: number;
    saldoRestante: number;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_cedula: string;
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

  const formatDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
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

            {/* RECORDATORIOS - Zapatos Listos */}
            {data.recordatorios.length > 0 && (
              <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
                <div className="table-header">
                  <h3>🔔 Recordatorios — Listos para Retirar ({data.recordatorios.length})</h3>
                </div>
                <div className="recordatorios-list">
                  {data.recordatorios.map(r => (
                    <div key={r.id} className="recordatorio-item">
                      <div className="recordatorio-info">
                        <div className="recordatorio-cliente">
                          <strong>{r.cliente_nombre}</strong>
                          {r.cliente_cedula && <span className="recordatorio-cedula">{r.cliente_cedula}</span>}
                        </div>
                        <div className="recordatorio-detalle">
                          <span>🎫 {r.numero}</span>
                          <span>👟 {r.descripcion_zapato || 'Sin descripción'}</span>
                          <span>📅 {formatDate(r.fecha_ingreso)}</span>
                        </div>
                        <div className="recordatorio-precio">
                          Total: ${r.total.toFixed(2)}
                          {r.totalPagado > 0 && <span> · Pagado: ${r.totalPagado.toFixed(2)}</span>}
                          {r.saldoRestante > 0
                            ? <span style={{ color: '#f59e0b', fontWeight: 700 }}> · Debe: ${r.saldoRestante.toFixed(2)}</span>
                            : <span style={{ color: '#22c55e', fontWeight: 700 }}> · ✅ PAGADO</span>
                          }
                        </div>
                      </div>
                      <div className="recordatorio-actions">
                        <a
                          href={generarRecordatorioWhatsApp({
                            numero: r.numero,
                            cliente_nombre: r.cliente_nombre,
                            cliente_telefono: r.cliente_telefono,
                            descripcion_zapato: r.descripcion_zapato,
                            total: r.total,
                            totalPagado: r.totalPagado,
                            saldoRestante: r.saldoRestante,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm"
                        >
                          📱 Recordar
                        </a>
                        <Link href={`/ticket/${r.numero}`} className="btn btn-secondary btn-sm">
                          👁️ Ver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
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
