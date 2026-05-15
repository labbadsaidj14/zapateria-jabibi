'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { generarMensajeWhatsApp } from '@/lib/whatsapp';

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
  total: number;
  notas: string;
  servicios: Array<{ descripcion: string; precio: number }>;
  materiales: Array<{ material_nombre: string; cantidad: number; unidad: string; subtotal: number }>;
  config: {
    nombre_negocio: string;
    telefono: string;
    direccion: string;
  };
}

export default function TicketViewPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<TicketDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setTicket(null);
        } else {
          setTicket(data);
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

  const whatsappLink = generarMensajeWhatsApp({
    numero: ticket.numero,
    cliente_nombre: ticket.cliente_nombre,
    descripcion_zapato: ticket.descripcion_zapato,
    descripcion_trabajo: ticket.descripcion_trabajo,
    estado: ticket.estado,
    total: ticket.total,
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

        {/* ZAPATO */}
        <div className="ticket-section-title">Información del Zapato</div>
        <div className="ticket-detail">
          <span className="label">Zapato</span>
          <span className="value">{ticket.descripcion_zapato || '—'}</span>
        </div>
        <div className="ticket-detail">
          <span className="label">Trabajo</span>
          <span className="value">{ticket.descripcion_trabajo || '—'}</span>
        </div>

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

        {/* SERVICIOS */}
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

        {/* DESCUENTO */}
        {ticket.descuento > 0 && (
          <div className="ticket-detail" style={{ color: '#22c55e' }}>
            <span className="label">Descuento</span>
            <span className="value">-${ticket.descuento.toFixed(2)}</span>
          </div>
        )}

        {/* TOTAL */}
        <div className="ticket-total">
          Total: ${ticket.total.toFixed(2)}
        </div>

        {/* NOTAS */}
        {ticket.notas && (
          <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#888', fontStyle: 'italic' }}>
            📝 {ticket.notas}
          </div>
        )}

        {/* FOOTER */}
        <div className="ticket-footer">
          <p>¡Gracias por su preferencia!</p>
          <p>Conserve este ticket para retirar su calzado</p>
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
