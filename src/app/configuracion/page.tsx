'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/components/AuthContext';

interface Config {
  nombre_negocio: string;
  telefono: string;
  direccion: string;
  prefijo_ticket: string;
  visitas_frecuente: number;
}

interface Categoria {
  id: number;
  nivel: number;
  nombre: string;
  padre_id: number | null;
  orden: number;
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
  activo: boolean;
}

const NIVEL_NAMES = ['', 'Categoría', 'Tipo', 'Color', 'Material', 'Talla'];
const NIVEL_DESCRIPTIONS = ['', 'Calzado, Bolsos, etc.', 'Deportivo, Casual, etc.', 'Negro, Marrón, etc.', 'Cuero, Tela, etc.', '35, 36, S, M, etc.'];

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'negocio' | 'categorias' | 'usuarios'>('negocio');

  // Config state
  const [config, setConfig] = useState<Config>({
    nombre_negocio: 'Zapatería Jabibi',
    telefono: '',
    direccion: '',
    prefijo_ticket: 'JAB-',
    visitas_frecuente: 5,
  });
  const [guardado, setGuardado] = useState(false);

  // Categorias state
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nivelActivo, setNivelActivo] = useState(1);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [padreSeleccionado, setPadreSeleccionado] = useState<number | null>(null);

  // Usuarios state
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', pin: '', rol: 'usuario' });
  const [errorUsuario, setErrorUsuario] = useState('');

  useEffect(() => {
    fetch('/api/configuracion').then(r => r.json()).then(setConfig);
    cargarCategorias();
    cargarUsuarios();
  }, []);

  const cargarCategorias = () => {
    fetch('/api/categorias').then(r => r.json()).then(setCategorias);
  };

  const cargarUsuarios = () => {
    fetch('/api/auth/usuarios').then(r => r.json()).then(setUsuarios);
  };

  const guardarConfig = async () => {
    await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    const body: Record<string, unknown> = {
      nivel: nivelActivo,
      nombre: nuevaCategoria.trim(),
      orden: categorias.filter(c => c.nivel === nivelActivo).length + 1,
    };
    if (nivelActivo === 2 && padreSeleccionado) {
      body.padre_id = padreSeleccionado;
    }
    await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setNuevaCategoria('');
    cargarCategorias();
  };

  const eliminarCategoria = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    cargarCategorias();
  };

  const agregarUsuario = async () => {
    setErrorUsuario('');
    if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.pin.trim()) {
      setErrorUsuario('Nombre y PIN son obligatorios');
      return;
    }
    if (nuevoUsuario.pin.length < 4) {
      setErrorUsuario('El PIN debe tener al menos 4 dígitos');
      return;
    }
    const res = await fetch('/api/auth/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorUsuario(data.error || 'Error al crear usuario');
      return;
    }
    setNuevoUsuario({ nombre: '', pin: '', rol: 'usuario' });
    cargarUsuarios();
  };

  const eliminarUsuario = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/auth/usuarios/${id}`, { method: 'DELETE' });
    cargarUsuarios();
  };

  const toggleRol = async (id: number, rolActual: string) => {
    const nuevoRol = rolActual === 'admin' ? 'usuario' : 'admin';
    await fetch(`/api/auth/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    cargarUsuarios();
  };

  const categoriasNivel = categorias.filter(c => c.nivel === nivelActivo);
  const categoriasNivel1 = categorias.filter(c => c.nivel === 1);

  if (!isAdmin) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="empty-state">
            <div className="icon">🔒</div>
            <p>No tienes permisos para acceder a esta sección</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Administra los parámetros del sistema</p>
          </div>
        </div>

        {/* TABS */}
        <div className="config-tabs">
          <button className={`config-tab ${tab === 'negocio' ? 'active' : ''}`} onClick={() => setTab('negocio')}>🏪 Negocio</button>
          <button className={`config-tab ${tab === 'categorias' ? 'active' : ''}`} onClick={() => setTab('categorias')}>📋 Categorías</button>
          <button className={`config-tab ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>👥 Usuarios</button>
        </div>

        <div style={{ maxWidth: 700 }}>
          {/* TAB: NEGOCIO */}
          {tab === 'negocio' && (
            <div className="ticket-section-card">
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
              <button className="btn btn-primary" onClick={guardarConfig} style={{ marginTop: 8 }}>
                💾 Guardar Configuración
              </button>
            </div>
          )}

          {/* TAB: CATEGORÍAS */}
          {tab === 'categorias' && (
            <div className="ticket-section-card">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                Configura las opciones que aparecen al describir un producto en el ticket. Cada nivel es un paso de selección.
              </p>

              {/* Nivel tabs */}
              <div className="nivel-tabs">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`nivel-tab ${nivelActivo === n ? 'active' : ''}`}
                    onClick={() => setNivelActivo(n)}
                  >
                    N{n}: {NIVEL_NAMES[n]}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
                  {NIVEL_DESCRIPTIONS[nivelActivo]}
                  {nivelActivo === 2 && ' (depende de la categoría padre)'}
                </div>

                {/* Padre selector for nivel 2 */}
                {nivelActivo === 2 && (
                  <div className="form-group">
                    <label className="form-label">Categoría padre (Nivel 1)</label>
                    <select className="form-select" value={padreSeleccionado || ''} onChange={e => setPadreSeleccionado(e.target.value ? parseInt(e.target.value) : null)}>
                      <option value="">Todas las categorías</option>
                      {categoriasNivel1.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* List of categories */}
                <div className="categorias-list">
                  {(nivelActivo === 2 && padreSeleccionado
                    ? categoriasNivel.filter(c => c.padre_id === padreSeleccionado)
                    : categoriasNivel
                  ).map(c => (
                    <div key={c.id} className="categoria-item">
                      <span>
                        {c.nombre}
                        {nivelActivo === 2 && c.padre_id && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                            ← {categoriasNivel1.find(p => p.id === c.padre_id)?.nombre}
                          </span>
                        )}
                      </span>
                      <button className="btn btn-icon btn-sm" onClick={() => eliminarCategoria(c.id)} title="Eliminar">🗑️</button>
                    </div>
                  ))}
                  {categoriasNivel.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>No hay opciones configuradas</p>
                  )}
                </div>

                {/* Add new */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    className="form-input"
                    placeholder={`Nueva opción de ${NIVEL_NAMES[nivelActivo].toLowerCase()}...`}
                    value={nuevaCategoria}
                    onChange={e => setNuevaCategoria(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregarCategoria()}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={agregarCategoria}>+ Agregar</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USUARIOS */}
          {tab === 'usuarios' && (
            <div className="ticket-section-card">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                Administra los usuarios del sistema. Los administradores pueden acceder a Configuración y eliminar registros.
              </p>

              {/* Lista de usuarios */}
              <div className="categorias-list">
                {usuarios.map(u => (
                  <div key={u.id} className="categoria-item">
                    <div>
                      <strong>{u.nombre}</strong>
                      <span className={`badge ${u.rol === 'admin' ? 'badge-listo' : 'badge-en-proceso'}`} style={{ marginLeft: 8 }}>
                        {u.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleRol(u.id, u.rol)} title="Cambiar rol">
                        {u.rol === 'admin' ? '↓ Bajar' : '↑ Subir'}
                      </button>
                      <button className="btn btn-icon btn-sm" onClick={() => eliminarUsuario(u.id)} title="Eliminar">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nuevo usuario */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent)' }}>Nuevo Usuario</h4>
                {errorUsuario && <div className="alert alert-danger" style={{ marginBottom: 12 }}>❌ {errorUsuario}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-input" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} placeholder="Nombre del usuario" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN (4+ dígitos)</label>
                    <input className="form-input" type="password" value={nuevoUsuario.pin} onChange={e => setNuevoUsuario({ ...nuevoUsuario, pin: e.target.value })} placeholder="1234" maxLength={6} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
                    <option value="usuario">👤 Usuario</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-sm" onClick={agregarUsuario}>+ Crear Usuario</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
