'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Panel', icon: '📊' },
  { href: '/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/clientes', label: 'Clientes', icon: '👤' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Zapatería Jabibi</h1>
        <p>Sistema Administrativo</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
