'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

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
    await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
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
            <table className="data-table">
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
