'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  es_frecuente: number;
}

interface Material {
  id: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number;
}

interface Servicio {
  descripcion: string;
  precio: string;
}

interface MatUsado {
  material_id: number;
  cantidad: string;
  nombre?: string;
  costo_unitario?: number;
}

export default function NuevoTicketPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', cedula: '', telefono: '' });

  const [form, setForm] = useState({
    descripcion_zapato: '',
    descripcion_trabajo: '',
    fecha_entrega: '',
    descuento: '0',
    notas: '',
  });

  const [servicios, setServicios] = useState<Servicio[]>([{ descripcion: '', precio: '' }]);
  const [matsUsados, setMatsUsados] = useState<MatUsado[]>([]);

  useEffect(() => {
    fetch('/api/materiales').then(r => r.json()).then(setMateriales);
  }, []);

  useEffect(() => {
    if (busquedaCliente.length >= 1) {
      fetch(`/api/clientes?q=${encodeURIComponent(busquedaCliente)}`).then(r => r.json()).then(data => {
        setClientes(data);
        setShowClienteDropdown(true);
      });
    } else {
      setClientes([]);
      setShowClienteDropdown(false);
    }
  }, [busquedaCliente]);

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c);
    setBusquedaCliente(`${c.nombre} - ${c.cedula || 'Sin cédula'}`);
    setShowClienteDropdown(false);
  };

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim()) return;
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoCliente),
    });
    if (res.ok) {
      const cliente = await res.json();
      seleccionarCliente(cliente);
      setShowNuevoCliente(false);
      setNuevoCliente({ nombre: '', cedula: '', telefono: '' });
    }
  };

  const addServicio = () => setServicios([...servicios, { descripcion: '', precio: '' }]);
  const removeServicio = (i: number) => setServicios(servicios.filter((_, idx) => idx !== i));
  const updateServicio = (i: number, field: keyof Servicio, val: string) => {
    const copy = [...servicios];
    copy[i] = { ...copy[i], [field]: val };
    setServicios(copy);
  };

  const addMaterial = () => setMatsUsados([...matsUsados, { material_id: 0, cantidad: '' }]);
  const removeMaterial = (i: number) => setMatsUsados(matsUsados.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, field: string, val: string | number) => {
    const copy = [...matsUsados];
    if (field === 'material_id') {
      const mat = materiales.find(m => m.id === Number(val));
      copy[i] = { ...copy[i], material_id: Number(val), nombre: mat?.nombre, costo_unitario: mat?.costo_unitario };
    } else {
      copy[i] = { ...copy[i], [field]: val };
    }
    setMatsUsados(copy);
  };

  const calcTotal = () => {
    const totalServicios = servicios.reduce((sum, s) => sum + (parseFloat(s.precio) || 0), 0);
    const totalMats = matsUsados.reduce((sum, m) => sum + ((m.costo_unitario || 0) * (parseFloat(m.cantidad) || 0)), 0);
    const subtotal = totalServicios + totalMats;
    const descuento = parseFloat(form.descuento) || 0;
    return Math.max(0, subtotal - descuento);
  };

  const guardar = async () => {
    if (!clienteSeleccionado) { alert('Selecciona un cliente'); return; }

    const body = {
      cliente_id: clienteSeleccionado.id,
      descripcion_zapato: form.descripcion_zapato,
      descripcion_trabajo: form.descripcion_trabajo,
      fecha_entrega: form.fecha_entrega,
      descuento: parseFloat(form.descuento) || 0,
      total: calcTotal(),
      notas: form.notas,
      servicios: servicios.filter(s => s.descripcion.trim()).map(s => ({
        descripcion: s.descripcion,
        precio: parseFloat(s.precio) || 0,
      })),
      materiales: matsUsados.filter(m => m.material_id > 0 && parseFloat(m.cantidad) > 0).map(m => ({
        material_id: m.material_id,
        cantidad: parseFloat(m.cantidad) || 0,
      })),
    };

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const ticket = await res.json();
      router.push(`/ticket/${ticket.numero}`);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Nuevo Ticket</h1>
            <p className="page-subtitle">Completa los datos del servicio para generar el recibo</p>
          </div>
        </div>

        <div style={{ maxWidth: 700 }}>
          {/* CLIENTE */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent)' }}>👤 Cliente</h3>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                placeholder="Buscar por nombre o cédula..."
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setClienteSeleccionado(null); }}
                onFocus={() => busquedaCliente.length >= 1 && setShowClienteDropdown(true)}
              />
              {showClienteDropdown && clientes.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', maxHeight: 200, overflowY: 'auto', zIndex: 50
                }}>
                  {clientes.map(c => (
                    <div
                      key={c.id}
                      onClick={() => seleccionarCliente(c)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span><strong>{c.nombre}</strong></span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {c.cedula || 'Sin cédula'} {c.es_frecuente ? '⭐' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showClienteDropdown && clientes.length === 0 && busquedaCliente.length >= 2 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, zIndex: 50 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>No se encontró el cliente</p>
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowClienteDropdown(false); setShowNuevoCliente(true); setNuevoCliente({ ...nuevoCliente, nombre: busquedaCliente }); }}>
                    + Crear nuevo cliente
                  </button>
                </div>
              )}
            </div>
            {clienteSeleccionado?.es_frecuente === 1 && (
              <div className="alert" style={{ background: 'var(--success-light)', color: 'var(--success)', marginTop: 10, border: '1px solid rgba(34,197,94,0.3)' }}>
                ⭐ ¡Cliente frecuente! Puedes aplicar descuento
              </div>
            )}
          </div>

          {/* Nuevo Cliente inline */}
          {showNuevoCliente && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent)' }}>Registrar Nuevo Cliente</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cédula</label>
                  <input className="form-input" value={nuevoCliente.cedula} onChange={e => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={crearNuevoCliente}>Guardar y seleccionar</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNuevoCliente(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* ZAPATO Y TRABAJO */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent)' }}>👟 Zapato y Trabajo</h3>
            <div className="form-group">
              <label className="form-label">Descripción del Zapato</label>
              <input className="form-input" value={form.descripcion_zapato} onChange={e => setForm({ ...form, descripcion_zapato: e.target.value })} placeholder="Ej: Bota negra de cuero, talla 42" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción del Trabajo</label>
              <textarea className="form-textarea" value={form.descripcion_trabajo} onChange={e => setForm({ ...form, descripcion_trabajo: e.target.value })} placeholder="Ej: Cambio de suela completa, pegar tacón, costura lateral" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de Entrega Estimada</label>
                <input className="form-input" type="date" value={form.fecha_entrega} onChange={e => setForm({ ...form, fecha_entrega: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notas Adicionales</label>
                <input className="form-input" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Cualquier observación..." />
              </div>
            </div>
          </div>

          {/* SERVICIOS */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>🛠️ Servicios</h3>
              <button className="btn btn-secondary btn-sm" onClick={addServicio}>+ Agregar</button>
            </div>
            {servicios.map((s, i) => (
              <div key={i} className="form-row" style={{ marginBottom: 8, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input className="form-input" placeholder="Descripción del servicio" value={s.descripcion} onChange={e => updateServicio(i, 'descripcion', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0, width: 120 }}>
                    <input className="form-input" type="number" step="0.01" placeholder="$ Precio" value={s.precio} onChange={e => updateServicio(i, 'precio', e.target.value)} />
                  </div>
                  {servicios.length > 1 && (
                    <button className="btn btn-icon btn-sm" onClick={() => removeServicio(i)}>🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* MATERIALES */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>📦 Materiales Usados (se descuentan del inventario)</h3>
              <button className="btn btn-secondary btn-sm" onClick={addMaterial}>+ Agregar</button>
            </div>
            {matsUsados.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin materiales agregados (opcional)</p>
            )}
            {matsUsados.map((m, i) => (
              <div key={i} className="form-row" style={{ marginBottom: 8, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select className="form-select" value={m.material_id} onChange={e => updateMaterial(i, 'material_id', e.target.value)}>
                    <option value={0}>Seleccionar material...</option>
                    {materiales.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.nombre} ({mat.cantidad} {mat.unidad})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0, width: 100 }}>
                    <input className="form-input" type="number" step="0.1" placeholder="Cant." value={m.cantidad} onChange={e => updateMaterial(i, 'cantidad', e.target.value)} />
                  </div>
                  <button className="btn btn-icon btn-sm" onClick={() => removeMaterial(i)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descuento ($)</label>
                <input className="form-input" type="number" step="0.01" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>TOTAL A COBRAR</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>${calcTotal().toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={guardar} style={{ flex: 1 }}>
              🎫 Generar Ticket
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/tickets')}>
              Cancelar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
