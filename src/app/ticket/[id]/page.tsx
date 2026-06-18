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

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setTicket(null);
        } else {
          setTicket(data);
          // Fetch abonos data
          fetch(`/api/abonos/${data.id}`)
            .then(r => r.json())
            .then(setAbonosData)
            .catch(() => {});
        }
        setLoading(false);
      });
  }, [params.id]);

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
            {/* Legacy: single product format */}
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

        {/* LEGACY SERVICES (without articulo) */}
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
            fontWeight: 700
          }}>
            {ticket.estado}
          </span>
        </div>

        {/* ═══════ SECCIÓN DE PAGO ═══════ */}
        <div className="ticket-section-title">💰 Resumen de Pago</div>

        {/* TOTAL */}
        <div className="ticket-total">
          Total: ${totalTicket.toFixed(2)}
        </div>

        {/* ABONADO */}
        {totalAbonado > 0 && (
          <div className="ticket-detail" style={{ color: '#22c55e' }}>
            <span className="label">✅ Abonado</span>
            <span className="value" style={{ fontWeight: 700 }}>
              ${totalAbonado.toFixed(2)}
            </span>
          </div>
        )}

        {/* Detalle: Abono inicial / depósito */}
        {abonoInicial > 0 && (
          <div className="ticket-detail" style={{ fontSize: '0.82rem', color: '#888' }}>
            <span className="label" style={{ paddingLeft: 12 }}>↳ Depósito inicial</span>
            <span className="value">${abonoInicial.toFixed(2)}</span>
          </div>
        )}

        {/* Detalle: Cada abono individual */}
        {abonosData?.abonos && abonosData.abonos.length > 0 && abonosData.abonos.map((abono, i) => (
          <div className="ticket-detail" key={abono.id || i} style={{ fontSize: '0.82rem', color: '#888' }}>
            <span className="label" style={{ paddingLeft: 12 }}>
              ↳ Abono {formatDate(abono.fecha)}{abono.nota ? ` (${abono.nota})` : ''}
            </span>
            <span className="value">${abono.monto.toFixed(2)}</span>
          </div>
        ))}

        {/* RESTANTE o PAGADO */}
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
            background: 'rgba(217, 119, 6, 0.08)',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(217, 119, 6, 0.2)',
          }}>
            <span className="label" style={{ color: '#D97706' }}><strong>💳 Resta por pagar</strong></span>
            <span className="value" style={{ fontWeight: 800, color: '#D97706', fontSize: '1.1rem' }}>
              ${restante.toFixed(2)}
            </span>
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

      {/* ACTIONS */}
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

