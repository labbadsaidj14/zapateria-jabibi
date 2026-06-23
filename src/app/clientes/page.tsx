'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { descargarVCard } from '@/lib/vcard';

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
  total_visitas: number;
  es_frecuente: number;
  fecha_registro: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', correo: '' });
  const [error, setError] = useState('');

  const cargar = (q = '') => {
    fetch(`/api/clientes?q=${encodeURIComponent(q)}`).then(r => r.json()).then(setClientes);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ nombre: '', cedula: '', telefono: '', correo: '' });
    setError('');
    setShowModal(true);
  };

  const abrirEditar = (c: Cliente) => {
    setEditId(c.id);
    setForm({ nombre: c.nombre, cedula: c.cedula, telefono: c.telefono, correo: c.correo });
    setError('');
    setShowModal(true);
  };

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }

    const url = editId ? `/api/clientes/${editId}` : '/api/clientes';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Error al guardar');
      return;
    }

    setShowModal(false);
    cargar(busqueda);
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;

    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });

    if (res.status === 409) {
      const data = await res.json();
      if (data.tieneTickets) {
        const confirmar = confirm(
          `⚠️ ${data.error}\n\nSe eliminarán ${data.cantidadTickets} ticket(s) y todos sus registros asociados.\n\n¿Confirmar eliminación?`
        );
        if (!confirmar) return;

        const resForzar = await fetch(`/api/clientes/${id}?forzar=1`, { method: 'DELETE' });
        if (!resForzar.ok) {
          const errData = await resForzar.json();
          alert(`❌ ${errData.error || 'Error al eliminar'}`);
          return;
        }
      }
    } else if (!res.ok) {
      const data = await res.json();
      alert(`❌ ${data.error || 'Error al eliminar el cliente'}`);
      return;
    }

    cargar(busqueda);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">Busca por nombre o cédula para encontrar un cliente rápidamente</p>
          </div>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo Cliente
          </button>
        </div>

        <div className="data-table-wrapper">
          <div className="table-header">
            <h3>{clientes.length} cliente(s)</h3>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por nombre o cédula..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {clientes.length > 0 ? (
            <>
              {/* Desktop table */}
              <table className="data-table desktop-only">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Visitas</th>
                    <th>Frecuente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.nombre}</strong></td>
                      <td>{c.cedula || '—'}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>{c.total_visitas}</td>
                      <td>{c.es_frecuente ? <span className="badge badge-listo">⭐ Sí</span> : '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)} style={{ marginRight: 6 }}>
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(c.id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="mobile-cards mobile-only">
                {clientes.map(c => (
                  <div key={c.id} className="client-card">
                    <div className="client-card-header">
                      <div>
                        <strong className="client-card-name">{c.nombre}</strong>
                        {c.es_frecuente ? <span className="badge badge-listo" style={{ marginLeft: 8, fontSize: '0.7rem' }}>⭐ Frecuente</span> : null}
                      </div>
                    </div>
                    <div className="client-card-details">
                      {c.cedula && <span>🪪 {c.cedula}</span>}
                      {c.telefono && <span>📞 {c.telefono}</span>}
                      <span>📋 {c.total_visitas} visita{c.total_visitas !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="client-card-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(c.id)}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="icon">👤</div>
              <p>{busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
              {!busqueda && <button className="btn btn-primary" onClick={abrirNuevo}>Registrar primer cliente</button>}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button className="btn btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">❌ {error}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cédula</label>
                    <input className="form-input" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} placeholder="V-12345678" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="0412-1234567" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo (opcional)</label>
                  <input className="form-input" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar}>Guardar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
