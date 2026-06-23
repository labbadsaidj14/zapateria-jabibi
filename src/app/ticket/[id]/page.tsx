'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { generarMensajeWhatsApp } from '@/lib/whatsapp';

interface ArticuloDetalle {
  id: number;
  nivel1_categoria: string;
  nivel2_tipo: string;
  nivel3_color: string;
  nivel4_material: string;
  nivel5_talla: string;
  descripcion_trabajo: string;
  servicios: Array<{ descripcion: string; precio: number }>;
}

interface AbonoDetalle {
  id: number;
  monto: number;
  nota: string;
  fecha: string;
}

interface TicketDetalle {
  id: number;
  numero: string;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_telefono: string;
  descripcion_zapato: string;
  descripcion_trabajo: string;
  estado: string;
  fecha_ingreso: string;
  fecha_entrega: string;
  descuento: number;
  deposito: number;
  abono_inicial: number;
  total: number;
  notas: string;
  articulos: ArticuloDetalle[];
  servicios: Array<{ descripcion: string; precio: number }>;
  materiales: Array<{ material_nombre: string; cantidad: number; unidad: string; subtotal: number }>;
  config: {
    nombre_negocio: string;
    telefono: string;
    direccion: string;
  };
}

interface AbonosData {
  abonos: AbonoDetalle[];
  totalPagado: number;
  restante: number;
  total: number;
}

export default function TicketViewPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<TicketDetalle | null>(null);
  const [abonosData, setAbonosData] = useState<AbonosData | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoNota, setPagoNota] = useState('');
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [pagoExito, setPagoExito] = useState('');

  const cargarAbonos = (ticketId: number) => {
    fetch(`/api/abonos/${ticketId}`)
      .then(r => r.json())
      .then(setAbonosData)
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setTicket(null);
        } else {
          setTicket(data);
          cargarAbonos(data.id);
        }
        setLoading(false);
      });
  }, [params.id]);

  const registrarAbono = async () => {
    if (!ticket) return;
    const monto = parseFloat(pagoMonto);
    if (!monto || monto <= 0) {
      setPagoError('Ingresa un monto válido mayor a 0');
      return;
    }

    setPagoLoading(true);
    setPagoError('');
    setPagoExito('');

    try {
      const res = await fetch(`/api/abonos/${ticket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, nota: pagoNota.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPagoError(err.error || 'Error al registrar el pago');
        return;
      }

      const data = await res.json();
      setAbonosData(data);
      setPagoMonto('');
      setPagoNota('');
      setShowPagoForm(false);
      setPagoExito('✅ Pago registrado correctamente');
      setTimeout(() => setPagoExito(''), 5000);
    } catch {
      setPagoError('Error de conexión al registrar el pago');
    } finally {
      setPagoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ticket-view">
        <div className="empty-state"><p>Cargando ticket...</p></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-view">
        <div className="empty-state">
          <div className="icon">❌</div>
          <p>Ticket no encontrado</p>
        </div>
      </div>
    );
  }

  // Calculate payment totals
  const totalTicket = ticket.total;
  const abonoInicial = ticket.abono_inicial || ticket.deposito || 0;
  const totalAbonos = abonosData?.abonos?.reduce((sum, a) => sum + (a.monto || 0), 0) || 0;
  const totalAbonado = abonoInicial + totalAbonos;
  const restante = Math.max(0, totalTicket - totalAbonado);
  const estaPagado = restante <= 0 && totalTicket > 0;

  const whatsappLink = generarMensajeWhatsApp({
    numero: ticket.numero,
    cliente_nombre: ticket.cliente_nombre,
    cliente_telefono: ticket.cliente_telefono,
    descripcion_zapato: ticket.descripcion_zapato,
    descripcion_trabajo: ticket.descripcion_trabajo,
    estado: ticket.estado,
    total: totalTicket,
    totalAbonado,
    restante,
    estaPagado,
    fecha_entrega: ticket.fecha_entrega,
  });

  const formatDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const getArticuloDesc = (a: ArticuloDetalle) => {
    return [a.nivel1_categoria, a.nivel2_tipo, a.nivel3_color, a.nivel4_material, a.nivel5_talla]
      .filter(Boolean).join(' > ') || 'Sin descripción';
  };

  return (
    <div className="ticket-view">
      <div className="ticket-card">

        {/* HEADER */}
        <div className="ticket-brand">
          <h1>{ticket.config?.nombre_negocio || 'ZAPATERÍA JABIBI'}</h1>
          {ticket.config?.direccion && <p>📍 {ticket.config.direccion}</p>}
          {ticket.config?.telefono && <p>📞 {ticket.config.telefono}</p>}
        </div>

        <div className="ticket-num">🎫 {ticket.numero}</div>

        {/* DATOS CLIENTE */}
        <div className="ticket-section-title">Datos del Cliente</div>
        <div className="ticket-detail">
          <span className="label">Cliente</span>
          <span className="value">{ticket.cliente_nombre || '—'}</span>
        </div>
        <div className="ticket-detail">
          <span className="label">Cédula</span>
          <span className="value">{ticket.cliente_cedula || '—'}</span>
        </div>

        {/* ARTÍCULOS */}
        {ticket.articulos && ticket.articulos.length > 0 ? (
          <>
            <div className="ticket-section-title">Artículos ({ticket.articulos.length})</div>
            {ticket.articulos.map((a, i) => (
              <div key={a.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < ticket.articulos.length - 1 ? '1px dashed #ddd' : 'none' }}>
                <div className="ticket-detail">
                  <span className="label">Artículo {i + 1}</span>
                  <span className="value">{getArticuloDesc(a)}</span>
                </div>
                {a.descripcion_trabajo && (
                  <div className="ticket-detail">
                    <span className="label">Trabajo</span>
                    <span className="value">{a.descripcion_trabajo}</span>
                  </div>
                )}
                {a.servicios && a.servicios.length > 0 && (
                  <>
                    {a.servicios.map((s, si) => (
                      <div className="ticket-detail" key={si}>
                        <span className="label" style={{ paddingLeft: 12 }}>↳ {s.descripcion}</span>
                        <span className="value">${s.precio.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="ticket-section-title">Información del Producto</div>
            <div className="ticket-detail">
              <span className="label">Producto</span>
              <span className="value">{ticket.descripcion_zapato || '—'}</span>
            </div>
            <div className="ticket-detail">
              <span className="label">Trabajo</span>
              <span className="value">{ticket.descripcion_trabajo || '—'}</span>
            </div>
          </>
        )}

        {/* LEGACY SERVICES */}
        {ticket.servicios?.length > 0 && (
          <>
            <div className="ticket-section-title">Servicios</div>
            {ticket.servicios.map((s, i) => (
              <div className="ticket-detail" key={i}>
                <span className="label">{s.descripcion}</span>
                <span className="value">${s.precio.toFixed(2)}</span>
              </div>
            ))}
          </>
        )}

        {/* MATERIALES */}
        {ticket.materiales?.length > 0 && (
          <>
            <div className="ticket-section-title">Materiales</div>
            {ticket.materiales.map((m, i) => (
              <div className="ticket-detail" key={i}>
                <span className="label">{m.material_nombre} ({m.cantidad} {m.unidad})</span>
                <span className="value">${m.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </>
        )}

        {/* FECHAS */}
        <div className="ticket-section-title">Fechas</div>
        <div className="ticket-detail">
          <span className="label">Ingreso</span>
          <span className="value">{formatDate(ticket.fecha_ingreso)}</span>
        </div>
        <div className="ticket-detail">
          <span className="label">Entrega estimada</span>
          <span className="value">{formatDate(ticket.fecha_entrega)}</span>
        </div>
        <div className="ticket-detail">
          <span className="label">Estado</span>
          <span className="value" style={{
            color: ticket.estado === 'Listo' ? '#22c55e' : ticket.estado === 'Entregado' ? '#888' : '#D97706',
            fontWeight: 700,
          }}>
            {ticket.estado}
          </span>
        </div>

        {/* ═══ RESUMEN DE PAGO ═══ */}
        <div className="ticket-section-title">💰 Resumen de Pago</div>

        <div className="ticket-total">
          Total: ${totalTicket.toFixed(2)}
        </div>

        {totalAbonado > 0 && (
          <div className="ticket-detail" style={{ color: '#22c55e' }}>
            <span className="label">✅ Abonado</span>
            <span className="value" style={{ fontWeight: 700 }}>${totalAbonado.toFixed(2)}</span>
          </div>
        )}

        {abonoInicial > 0 && (
          <div className="ticket-detail" style={{ fontSize: '0.82rem', color: '#888' }}>
            <span className="label" style={{ paddingLeft: 12 }}>↳ Depósito inicial</span>
            <span className="value">${abonoInicial.toFixed(2)}</span>
          </div>
        )}

        {abonosData?.abonos && abonosData.abonos.length > 0 && abonosData.abonos.map((abono, i) => (
          <div className="ticket-detail" key={abono.id || i} style={{ fontSize: '0.82rem', color: '#888' }}>
            <span className="label" style={{ paddingLeft: 12 }}>
              ↳ Abono {formatDate(abono.fecha)}{abono.nota ? ` (${abono.nota})` : ''}
            </span>
            <span className="value">${abono.monto.toFixed(2)}</span>
          </div>
        ))}

        {/* ESTADO: PAGADO o RESTANTE */}
        {estaPagado ? (
          <div className="ticket-detail" style={{ marginTop: 8 }}>
            <span className="label"><strong>Estado de Pago</strong></span>
            <span className="value" style={{
              fontWeight: 800,
              color: '#fff',
              background: '#22c55e',
              padding: '4px 14px',
              borderRadius: 8,
              fontSize: '0.95rem',
            }}>
              ✅ PAGADO
            </span>
          </div>
        ) : (
          <div className="ticket-detail" style={{
            marginTop: 8,
            background: 'rgba(217,119,6,0.08)',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(217,119,6,0.2)',
          }}>
            <span className="label" style={{ color: '#D97706' }}><strong>💳 Resta por pagar</strong></span>
            <span className="value" style={{ fontWeight: 800, color: '#D97706', fontSize: '1.1rem' }}>
              ${restante.toFixed(2)}
            </span>
          </div>
        )}

        {/* ═══ REGISTRAR PAGO ═══ */}
        {!estaPagado && (
          <div style={{ marginTop: 16 }}>
            {pagoExito && (
              <div style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#16a34a',
                fontSize: '0.9rem',
                marginBottom: 10,
                fontWeight: 600,
              }}>
                {pagoExito}
              </div>
            )}

            {!showPagoForm ? (
              <button
                className="btn btn-success"
                style={{ width: '100%', fontSize: '1rem', padding: '12px' }}
                onClick={() => { setShowPagoForm(true); setPagoError(''); }}
              >
                💵 Registrar Pago
              </button>
            ) : (
              <div style={{
                border: '2px solid #22c55e',
                borderRadius: 12,
                padding: 16,
                background: 'rgba(34,197,94,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <strong style={{ fontSize: '1rem' }}>💵 Registrar Pago</strong>
                  <button
                    className="btn btn-icon"
                    onClick={() => { setShowPagoForm(false); setPagoError(''); setPagoMonto(''); setPagoNota(''); }}
                  >
                    ✕
                  </button>
                </div>

                {pagoError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: 12,
                  }}>
                    ❌ {pagoError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">
                    Monto ($)
                    {restante > 0 && (
                      <span
                        style={{ marginLeft: 8, color: '#22c55e', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setPagoMonto(restante.toFixed(2))}
                      >
                        → Pagar todo (${restante.toFixed(2)})
                      </span>
                    )}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={`Máx. $${restante.toFixed(2)}`}
                    value={pagoMonto}
                    onChange={e => setPagoMonto(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Nota (opcional)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ej: Efectivo, transferencia Bs, Zelle..."
                    value={pagoNota}
                    onChange={e => setPagoNota(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && registrarAbono()}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    onClick={registrarAbono}
                    disabled={pagoLoading}
                  >
                    {pagoLoading ? 'Guardando...' : '✅ Confirmar Pago'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setShowPagoForm(false); setPagoError(''); setPagoMonto(''); setPagoNota(''); }}
                    disabled={pagoLoading}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje éxito cuando ya está pagado */}
        {estaPagado && pagoExito && (
          <div style={{
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#16a34a',
            fontSize: '0.9rem',
            marginTop: 10,
            fontWeight: 600,
          }}>
            {pagoExito}
          </div>
        )}

        {/* NOTAS */}
        {ticket.notas && (
          <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#888', fontStyle: 'italic' }}>
            📝 {ticket.notas}
          </div>
        )}

        {/* FOOTER */}
        <div className="ticket-footer">
          <p>¡Gracias por su preferencia!</p>
          <p>Conserve este ticket para retirar su producto</p>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="ticket-actions">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-success">
          📱 Enviar por WhatsApp
        </a>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Imprimir
        </button>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          ← Volver
        </button>
      </div>
    </div>
  );
}
