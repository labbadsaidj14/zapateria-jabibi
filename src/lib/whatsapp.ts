export function generarMensajeWhatsApp(ticket: {
  numero: string;
  cliente_nombre: string;
  descripcion_zapato: string;
  descripcion_trabajo: string;
  estado: string;
  total: number;
  fecha_entrega: string;
}): string {
  const mensaje = `🔧 *ZAPATERÍA JABIBI*
━━━━━━━━━━━━━━━━━━

📋 *Ticket:* ${ticket.numero}
👤 *Cliente:* ${ticket.cliente_nombre}

👟 *Zapato:* ${ticket.descripcion_zapato}
🛠️ *Trabajo:* ${ticket.descripcion_trabajo}

📌 *Estado:* ${ticket.estado}
📅 *Entrega estimada:* ${ticket.fecha_entrega || 'Por confirmar'}
💰 *Total:* $${ticket.total.toFixed(2)}

📍 Caracas, Parque Carabobo
📞 Contáctanos para más información

_Gracias por confiar en nosotros_ ✨`;

  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}
