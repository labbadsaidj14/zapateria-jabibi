'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Ticket {
  id: number;
  numero: string;
  cliente_nombre: string;
  cliente_cedula: string;
  descripcion_zapato: string;
  descripcion_trabajo: string;
  estado: string;
  fecha_ingreso: string;
  fecha_entrega: string;
  total: number;
}

const ESTADOS = ['', 'Recibido', 'En proceso', 'Listo', 'Entregado'];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = (q = '', estado = '') => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (estado) params.set('estado', estado);
    fetch(`/api/tickets?${params}`).then(r => r.json()).then(setTickets);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => cargar(busqueda, filtroEstado), 300);
    return () => clearTimeout(timer);
  }, [busqueda, filtroEstado]);

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    cargar(busqueda, filtroEstado);
  };

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
            <h1 className="page-title">Tickets</h1>
            <p className="page-subtitle">Busca por número de ticket, nombre o cédula del cliente</p>
          </div>
          <Link href="/tickets/nuevo" className="btn btn-primary">
            + Nuevo Ticket
          </Link>
        </div>

        <div className="data-table-wrapper">
          <div className="table-header">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <h3>{tickets.length} ticket(s)</h3>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{ width: 160 }}
              >
                {ESTADOS.map(e => (
                  <option key={e} value={e}>{e || 'Todos los estados'}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar ticket, cliente o cédula..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {tickets.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Ticket</th>
                  <th>Cliente</th>
                  <th>Zapato</th>
                  <th>Trabajo</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><Link href={`/ticket/${t.numero}`}><strong>{t.numero}</strong></Link></td>
                    <td>
                      {t.cliente_nombre || '—'}
                      {t.cliente_cedula && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.cliente_cedula}</div>}
                    </td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.descripcion_zapato || '—'}
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.descripcion_trabajo || '—'}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={t.estado}
                        onChange={e => cambiarEstado(t.id, e.target.value)}
                        style={{ width: 130, padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        {ESTADOS.filter(Boolean).map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </td>
                    <td>${t.total.toFixed(2)}</td>
                    <td>
                      <Link href={`/ticket/${t.numero}`} className="btn btn-secondary btn-sm">
                        👁️ Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="icon">🎫</div>
              <p>{busqueda ? 'No se encontraron tickets' : 'No hay tickets creados'}</p>
              {!busqueda && <Link href="/tickets/nuevo" className="btn btn-primary">Crear primer ticket</Link>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
