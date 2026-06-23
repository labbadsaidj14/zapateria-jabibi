/**
 * Generates a vCard (.vcf) string for a client contact.
 * When opened on a phone, it automatically prompts to save the contact.
 * This makes WhatsApp Business recognize the client instantly.
 */
export function generarVCard(cliente: {
  nombre: string;
  telefono?: string;
  cedula?: string;
  correo?: string;
}): string {
  const nombre = cliente.nombre.trim();
  const parts = nombre.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombre}
N:${lastName};${firstName};;;`;

  if (cliente.telefono) {
    // Clean the phone number
    const phone = cliente.telefono.replace(/[^0-9+]/g, '');
    vcard += `\nTEL;TYPE=CELL:${phone}`;
  }

  if (cliente.correo) {
    vcard += `\nEMAIL:${cliente.correo}`;
  }

  if (cliente.cedula) {
    vcard += `\nNOTE:Cédula: ${cliente.cedula}`;
  }

  vcard += `\nORG:Zapatería Jabibi - Cliente`;
  vcard += `\nEND:VCARD`;

  return vcard;
}

/**
 * Triggers a vCard download in the browser.
 * On mobile, this opens the "Add Contact" dialog automatically.
 */
export function descargarVCard(cliente: {
  nombre: string;
  telefono?: string;
  cedula?: string;
  correo?: string;
}) {
  const vcardData = generarVCard(cliente);
  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${cliente.nombre.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a Venezuelan phone number for WhatsApp links.
 * Ensures the number starts with country code 58.
 */
export function formatearTelefonoWhatsApp(telefono: string): string {
  if (!telefono) return '';
  // Remove all non-digits
  let phone = telefono.replace(/[^0-9]/g, '');

  // Venezuelan numbers: convert 04XX to 584XX
  if (phone.startsWith('0') && phone.length >= 10) {
    phone = '58' + phone.substring(1);
  }

  // If it doesn't start with country code, add 58
  if (!phone.startsWith('58') && phone.length <= 10) {
    phone = '58' + phone;
  }

  return phone;
}
