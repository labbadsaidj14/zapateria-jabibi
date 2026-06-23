import { formatearTelefonoWhatsApp } from './vcard';

export function generarMensajeWhatsApp(ticket: {
  numero: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  descripcion_zapato: string;
  descripcion_trabajo: string;
  estado: string;
  total: number;
  totalAbonado?: number;
  restante?: number;
  estaPagado?: boolean;
  deposito?: number;
  fecha_entrega: string;
}): string {
  // Support both new and legacy fields
  const totalAbonado = ticket.totalAbonado ?? ticket.deposito ?? 0;
  const restante = ticket.restante ?? Math.max(0, ticket.total - totalAbonado);
  const estaPagado = ticket.estaPagado ?? (restante <= 0 && ticket.total > 0);

  let mensaje = `🔧 *ZAPATERÍA JABIBI*
━━━━━━━━━━━━━━━━━━

📋 *Ticket:* ${ticket.numero}
👤 *Cliente:* ${ticket.cliente_nombre}

👟 *Producto:* ${ticket.descripcion_zapato}
🛠️ *Trabajo:* ${ticket.descripcion_trabajo}

📌 *Estado:* ${ticket.estado}
📅 *Entrega estimada:* ${ticket.fecha_entrega || 'Por confirmar'}

━━━━━━━━━━━━━━━━━━
💰 *RESUMEN DE PAGO*
━━━━━━━━━━━━━━━━━━
💵 *Total:* $${ticket.total.toFixed(2)}`;

  if (totalAbonado > 0) {
    mensaje += `\n✅ *Abonado:* $${totalAbonado.toFixed(2)}`;
  }

  if (estaPagado) {
    mensaje += `\n🟢 *Estado:* ¡PAGADO! ✅`;
  } else if (restante > 0) {
    mensaje += `\n💳 *Resta por pagar:* $${restante.toFixed(2)}`;
  }

  mensaje += `

📍 Caracas, Parque Carabobo
📞 Contáctanos para más información

_Gracias por confiar en nosotros_ ✨`;

  const phoneParam = formatearTelefonoWhatsApp(ticket.cliente_telefono || '');

  return `https://wa.me/${phoneParam}?text=${encodeURIComponent(mensaje)}`;
}


export function generarRecordatorioWhatsApp(ticket: {
  numero: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  descripcion_zapato: string;
  total: number;
  deposito?: number;
}): string {
  const saldoRestante = ticket.total - (ticket.deposito || 0);
  
  const mensaje = `¡Hola ${ticket.cliente_nombre}! 👋

Le informamos desde *ZAPATERÍA JABIBI* que su trabajo ya está *LISTO* para retirar ✅

📋 *Ticket:* ${ticket.numero}
👟 *Producto:* ${ticket.descripcion_zapato}
💰 *Total:* $${ticket.total.toFixed(2)}${saldoRestante > 0 && saldoRestante < ticket.total ? `\n💳 *Saldo pendiente:* $${saldoRestante.toFixed(2)}` : ''}

📍 Estamos en Caracas, Parque Carabobo
⏰ Le esperamos en nuestro horario habitual

_¡Gracias por confiar en nosotros!_ ✨`;

  const phone = ticket.cliente_telefono?.replace(/[^0-9]/g, '') || '';
  const phoneParam = phone ? phone : '';
  
  return `https://wa.me/${phoneParam}?text=${encodeURIComponent(mensaje)}`;
}
