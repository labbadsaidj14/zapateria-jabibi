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

interface Categoria {
  id: number;
  nivel: number;
  nombre: string;
  padre_id: number | null;
}

interface Servicio {
  descripcion: string;
  precio: string;
}

interface Articulo {
  nivel1: string;
  nivel2: string;
  nivel3: string;
  nivel4: string;
  nivel5: string;
  descripcion_trabajo: string;
  servicios: Servicio[];
  collapsed: boolean;
}

interface MatUsado {
  material_id: number;
  cantidad: string;
  nombre?: string;
  costo_unitario?: number;
}

const NIVEL_LABELS = ['Categoría', 'Tipo', 'Color', 'Material', 'Talla'];

export default function NuevoTicketPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', cedula: '', telefono: '' });

  // Categorias by level
  const [categoriasNivel1, setCategoriasNivel1] = useState<Categoria[]>([]);
  const [categoriasNivel2, setCategoriasNivel2] = useState<Categoria[]>([]);
  const [categoriasNivel3, setCategoriasNivel3] = useState<Categoria[]>([]);
  const [categoriasNivel4, setCategoriasNivel4] = useState<Categoria[]>([]);
  const [categoriasNivel5, setCategoriasNivel5] = useState<Categoria[]>([]);
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([]);

  const [form, setForm] = useState({
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_entrega: '',
    deposito: '0',
    notas: '',
  });

  const [articulos, setArticulos] = useState<Articulo[]>([{
    nivel1: '', nivel2: '', nivel3: '', nivel4: '', nivel5: '',
    descripcion_trabajo: '',
    servicios: [{ descripcion: '', precio: '' }],
    collapsed: false,
  }]);

  const [matsUsados, setMatsUsados] = useState<MatUsado[]>([]);

  useEffect(() => {
    fetch('/api/materiales').then(r => r.json()).then(setMateriales);
    fetch('/api/categorias').then(r => r.json()).then((data: Categoria[]) => {
      setAllCategorias(data);
      setCategoriasNivel1(data.filter(c => c.nivel === 1));
      setCategoriasNivel3(data.filter(c => c.nivel === 3));
      setCategoriasNivel4(data.filter(c => c.nivel === 4));
      setCategoriasNivel5(data.filter(c => c.nivel === 5));
    });
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

  // Articulo helpers
  const addArticulo = () => {
    setArticulos([...articulos, {
      nivel1: '', nivel2: '', nivel3: '', nivel4: '', nivel5: '',
      descripcion_trabajo: '',
      servicios: [{ descripcion: '', precio: '' }],
      collapsed: false,
    }]);
  };

  const removeArticulo = (i: number) => {
    if (articulos.length <= 1) return;
    setArticulos(articulos.filter((_, idx) => idx !== i));
  };

  const toggleCollapse = (i: number) => {
    const copy = [...articulos];
    copy[i] = { ...copy[i], collapsed: !copy[i].collapsed };
    setArticulos(copy);
  };

  const updateArticuloNivel = (artIdx: number, nivelKey: string, value: string) => {
    const copy = [...articulos];
    copy[artIdx] = { ...copy[artIdx], [nivelKey]: value };
    // If nivel1 changed, reset nivel2
    if (nivelKey === 'nivel1') {
      copy[artIdx].nivel2 = '';
    }
    setArticulos(copy);
  };

  const updateArticuloTrabajo = (artIdx: number, value: string) => {
    const copy = [...articulos];
    copy[artIdx] = { ...copy[artIdx], descripcion_trabajo: value };
    setArticulos(copy);
  };

  const addServicioToArticulo = (artIdx: number) => {
    const copy = [...articulos];
    copy[artIdx] = { ...copy[artIdx], servicios: [...copy[artIdx].servicios, { descripcion: '', precio: '' }] };
    setArticulos(copy);
  };

  const removeServicioFromArticulo = (artIdx: number, srvIdx: number) => {
    const copy = [...articulos];
    copy[artIdx] = { ...copy[artIdx], servicios: copy[artIdx].servicios.filter((_, i) => i !== srvIdx) };
    setArticulos(copy);
  };

  const updateServicioInArticulo = (artIdx: number, srvIdx: number, field: keyof Servicio, val: string) => {
    const copy = [...articulos];
    const servicios = [...copy[artIdx].servicios];
    servicios[srvIdx] = { ...servicios[srvIdx], [field]: val };
    copy[artIdx] = { ...copy[artIdx], servicios };
    setArticulos(copy);
  };

  const getNivel2Options = (artIdx: number) => {
    const selectedNivel1 = articulos[artIdx].nivel1;
    if (!selectedNivel1) return [];
    const padre = categoriasNivel1.find(c => c.nombre === selectedNivel1);
    if (!padre) return [];
    return allCategorias.filter(c => c.nivel === 2 && c.padre_id === padre.id);
  };

  // Material helpers
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
    const totalServicios = articulos.reduce((sum, a) =>
      sum + a.servicios.reduce((s, srv) => s + (parseFloat(srv.precio) || 0), 0), 0);
    const totalMats = matsUsados.reduce((sum, m) => sum + ((m.costo_unitario || 0) * (parseFloat(m.cantidad) || 0)), 0);
    return totalServicios + totalMats;
  };

  const calcSaldoRestante = () => {
    const total = calcTotal();
    const deposito = parseFloat(form.deposito) || 0;
    return Math.max(0, total - deposito);
  };

  const getArticuloResumen = (a: Articulo) => {
    const parts = [a.nivel1, a.nivel2, a.nivel3, a.nivel4, a.nivel5].filter(Boolean);
    return parts.length > 0 ? parts.join(' > ') : 'Sin descripción';
  };

  const guardar = async () => {
    if (!clienteSeleccionado) { alert('Selecciona un cliente'); return; }

    const body = {
      cliente_id: clienteSeleccionado.id,
      fecha_ingreso: form.fecha_ingreso,
      fecha_entrega: form.fecha_entrega,
      deposito: parseFloat(form.deposito) || 0,
      total: calcTotal(),
      notas: form.notas,
      articulos: articulos.map(a => ({
        nivel1_categoria: a.nivel1,
        nivel2_tipo: a.nivel2,
        nivel3_color: a.nivel3,
        nivel4_material: a.nivel4,
        nivel5_talla: a.nivel5,
        descripcion_trabajo: a.descripcion_trabajo,
        servicios: a.servicios.filter(s => s.descripcion.trim()).map(s => ({
          descripcion: s.descripcion,
          precio: parseFloat(s.precio) || 0,
        })),
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

        <div style={{ maxWidth: 750 }}>
          {/* CLIENTE */}
          <div className="ticket-section-card">
            <h3 className="section-title">👤 Cliente</h3>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                placeholder="Buscar por nombre o cédula..."
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setClienteSeleccionado(null); }}
                onFocus={() => busquedaCliente.length >= 1 && setShowClienteDropdown(true)}
              />
              {showClienteDropdown && clientes.length > 0 && (
                <div className="dropdown-list">
                  {clientes.map(c => (
                    <div key={c.id} onClick={() => seleccionarCliente(c)} className="dropdown-item">
                      <span><strong>{c.nombre}</strong></span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {c.cedula || 'Sin cédula'} {c.es_frecuente ? '⭐' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showClienteDropdown && clientes.length === 0 && busquedaCliente.length >= 2 && (
                <div className="dropdown-list" style={{ padding: 14 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>No se encontró el cliente</p>
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowClienteDropdown(false); setShowNuevoCliente(true); setNuevoCliente({ ...nuevoCliente, nombre: busquedaCliente }); }}>
                    + Crear nuevo cliente
                  </button>
                </div>
              )}
            </div>
            {clienteSeleccionado?.es_frecuente === 1 && (
              <div className="alert" style={{ background: 'var(--success-light)', color: 'var(--success)', marginTop: 10, border: '1px solid rgba(34,197,94,0.3)' }}>
                ⭐ ¡Cliente frecuente!
              </div>
            )}
          </div>

          {/* Nuevo Cliente inline */}
          {showNuevoCliente && (
            <div className="ticket-section-card" style={{ borderColor: 'var(--accent)' }}>
              <h3 className="section-title">Registrar Nuevo Cliente</h3>
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

          {/* FECHAS */}
          <div className="ticket-section-card">
            <h3 className="section-title">📅 Fechas</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de Ingreso</label>
                <input className="form-input" type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Entrega Estimada</label>
                <input className="form-input" type="date" value={form.fecha_entrega} onChange={e => setForm({ ...form, fecha_entrega: e.target.value })} />
              </div>
            </div>
          </div>

          {/* ARTÍCULOS */}
          <div className="ticket-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>📦 Artículos ({articulos.length})</h3>
              <button className="btn btn-secondary btn-sm" onClick={addArticulo}>+ Agregar artículo</button>
            </div>

            {articulos.map((art, artIdx) => (
              <div key={artIdx} className="articulo-card">
                <div className="articulo-header" onClick={() => toggleCollapse(artIdx)}>
                  <div className="articulo-title">
                    <span className="articulo-number">#{artIdx + 1}</span>
                    <span className="articulo-resumen">{getArticuloResumen(art)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {articulos.length > 1 && (
                      <button className="btn btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); removeArticulo(artIdx); }} title="Eliminar artículo">🗑️</button>
                    )}
                    <span className="articulo-collapse">{art.collapsed ? '▸' : '▾'}</span>
                  </div>
                </div>

                {!art.collapsed && (
                  <div className="articulo-body">
                    {/* 5 NIVELES */}
                    {/* Nivel 1 - Categoría */}
                    <div className="nivel-selector">
                      <label className="form-label">1. {NIVEL_LABELS[0]}</label>
                      <div className="nivel-buttons">
                        {categoriasNivel1.map(c => (
                          <button
                            key={c.id}
                            className={`nivel-btn ${art.nivel1 === c.nombre ? 'nivel-btn-active' : ''}`}
                            onClick={() => updateArticuloNivel(artIdx, 'nivel1', c.nombre)}
                          >
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nivel 2 - Tipo */}
                    {art.nivel1 && (
                      <div className="nivel-selector">
                        <label className="form-label">2. {NIVEL_LABELS[1]}</label>
                        <div className="nivel-buttons">
                          {getNivel2Options(artIdx).map(c => (
                            <button
                              key={c.id}
                              className={`nivel-btn ${art.nivel2 === c.nombre ? 'nivel-btn-active' : ''}`}
                              onClick={() => updateArticuloNivel(artIdx, 'nivel2', c.nombre)}
                            >
                              {c.nombre}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nivel 3 - Color */}
                    <div className="nivel-selector">
                      <label className="form-label">3. {NIVEL_LABELS[2]}</label>
                      <div className="nivel-buttons">
                        {categoriasNivel3.map(c => (
                          <button
                            key={c.id}
                            className={`nivel-btn ${art.nivel3 === c.nombre ? 'nivel-btn-active' : ''}`}
                            onClick={() => updateArticuloNivel(artIdx, 'nivel3', c.nombre)}
                          >
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nivel 4 - Material */}
                    <div className="nivel-selector">
                      <label className="form-label">4. {NIVEL_LABELS[3]}</label>
                      <div className="nivel-buttons">
                        {categoriasNivel4.map(c => (
                          <button
                            key={c.id}
                            className={`nivel-btn ${art.nivel4 === c.nombre ? 'nivel-btn-active' : ''}`}
                            onClick={() => updateArticuloNivel(artIdx, 'nivel4', c.nombre)}
                          >
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nivel 5 - Talla */}
                    <div className="nivel-selector">
                      <label className="form-label">5. {NIVEL_LABELS[4]}</label>
                      <div className="nivel-buttons">
                        {categoriasNivel5.map(c => (
                          <button
                            key={c.id}
                            className={`nivel-btn ${art.nivel5 === c.nombre ? 'nivel-btn-active' : ''}`}
                            onClick={() => updateArticuloNivel(artIdx, 'nivel5', c.nombre)}
                          >
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resumen */}
                    {(art.nivel1 || art.nivel2 || art.nivel3 || art.nivel4 || art.nivel5) && (
                      <div className="articulo-resumen-bar">
                        📋 {getArticuloResumen(art)}
                      </div>
                    )}

                    {/* Descripción del trabajo */}
                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label className="form-label">Descripción del Trabajo</label>
                      <textarea className="form-textarea" value={art.descripcion_trabajo} onChange={e => updateArticuloTrabajo(artIdx, e.target.value)} placeholder="Ej: Cambio de suela completa, pegar tacón..." />
                    </div>

                    {/* Servicios de este artículo */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>🛠️ Servicios</label>
                        <button className="btn btn-secondary btn-sm" onClick={() => addServicioToArticulo(artIdx)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>+ Servicio</button>
                      </div>
                      {art.servicios.map((s, sIdx) => (
                        <div key={sIdx} className="form-row" style={{ marginBottom: 8, alignItems: 'end' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <input className="form-input" placeholder="Descripción del servicio" value={s.descripcion} onChange={e => updateServicioInArticulo(artIdx, sIdx, 'descripcion', e.target.value)} />
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className="form-group" style={{ marginBottom: 0, width: 120 }}>
                              <input className="form-input" type="number" step="0.01" placeholder="$ Precio" value={s.precio} onChange={e => updateServicioInArticulo(artIdx, sIdx, 'precio', e.target.value)} />
                            </div>
                            {art.servicios.length > 1 && (
                              <button className="btn btn-icon btn-sm" onClick={() => removeServicioFromArticulo(artIdx, sIdx)}>🗑️</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MATERIALES */}
          <div className="ticket-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>📦 Materiales Usados</h3>
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

          {/* NOTAS */}
          <div className="ticket-section-card">
            <h3 className="section-title">📝 Notas</h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input className="form-input" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Cualquier observación adicional..." />
            </div>
          </div>

          {/* TOTAL Y DEPÓSITO */}
          <div className="ticket-section-card" style={{ borderColor: 'var(--accent)' }}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Depósito ($)</label>
                <input className="form-input" type="number" step="0.01" value={form.deposito} onChange={e => setForm({ ...form, deposito: e.target.value })} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>TOTAL</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>${calcTotal().toFixed(2)}</div>
                {parseFloat(form.deposito) > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Depósito: ${parseFloat(form.deposito).toFixed(2)} · <strong>Saldo: ${calcSaldoRestante().toFixed(2)}</strong>
                  </div>
                )}
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
