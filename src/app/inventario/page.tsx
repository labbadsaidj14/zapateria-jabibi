'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Material {
  id: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number;
  stock_minimo: number;
}

export default function InventarioPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', cantidad: '', unidad: 'unidad', costo_unitario: '', stock_minimo: '' });

  const cargar = () => {
    fetch('/api/materiales').then(r => r.json()).then(setMateriales);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ nombre: '', cantidad: '', unidad: 'unidad', costo_unitario: '', stock_minimo: '' });
    setShowModal(true);
  };

  const abrirEditar = (m: Material) => {
    setEditId(m.id);
    setForm({
      nombre: m.nombre,
      cantidad: String(m.cantidad),
      unidad: m.unidad,
      costo_unitario: String(m.costo_unitario),
      stock_minimo: String(m.stock_minimo),
    });
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;

    const body = {
      nombre: form.nombre,
      cantidad: parseFloat(form.cantidad) || 0,
      unidad: form.unidad,
      costo_unitario: parseFloat(form.costo_unitario) || 0,
      stock_minimo: parseFloat(form.stock_minimo) || 0,
    };

    const url = editId ? `/api/materiales/${editId}` : '/api/materiales';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setShowModal(false);
    cargar();
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este material?')) return;
    await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    cargar();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventario de Materiales</h1>
            <p className="page-subtitle">Controla los materiales disponibles y recibe alertas de stock bajo</p>
          </div>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo Material
          </button>
        </div>

        {materiales.some(m => m.stock_minimo > 0 && m.cantidad <= m.stock_minimo) && (
          <div className="alert alert-warning">
            ⚠️ Algunos materiales están por debajo del stock mínimo
          </div>
        )}

        <div className="data-table-wrapper">
          <div className="table-header">
            <h3>{materiales.length} material(es)</h3>
          </div>

          {materiales.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Costo Unit.</th>
                  <th>Stock Mín.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map(m => {
                  const bajo = m.stock_minimo > 0 && m.cantidad <= m.stock_minimo;
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.nombre}</strong></td>
                      <td className={bajo ? 'stock-low' : ''}>{m.cantidad}</td>
                      <td>{m.unidad}</td>
                      <td>${m.costo_unitario.toFixed(2)}</td>
                      <td>{m.stock_minimo}</td>
                      <td>
                        {bajo ? <span className="badge badge-recibido" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>⚠️ Bajo</span>
                          : <span className="badge badge-listo">✅ OK</span>}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(m)} style={{ marginRight: 6 }}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(m.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="icon">📦</div>
              <p>No hay materiales registrados</p>
              <button className="btn btn-primary" onClick={abrirNuevo}>Agregar primer material</button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editId ? 'Editar Material' : 'Nuevo Material'}</h2>
                <button className="btn btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Pegamento, Hilo, Suela" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input className="form-input" type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad</label>
                    <select className="form-select" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })}>
                      <option value="unidad">Unidad</option>
                      <option value="par">Par</option>
                      <option value="metro">Metro</option>
                      <option value="litro">Litro</option>
                      <option value="kilo">Kilogramo</option>
                      <option value="rollo">Rollo</option>
                      <option value="tubo">Tubo</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Costo Unitario ($)</label>
                    <input className="form-input" type="number" step="0.01" value={form.costo_unitario} onChange={e => setForm({ ...form, costo_unitario: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Mínimo</label>
                    <input className="form-input" type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} placeholder="0" />
                  </div>
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
