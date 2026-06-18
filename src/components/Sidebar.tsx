'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const links = [
  { href: '/', label: 'Panel', icon: '📊', adminOnly: false },
  { href: '/tickets', label: 'Tickets', icon: '🎫', adminOnly: false },
  { href: '/clientes', label: 'Clientes', icon: '👤', adminOnly: false },
  { href: '/inventario', label: 'Inventario', icon: '📦', adminOnly: false },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { usuario, logout, isAdmin } = useAuth();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredLinks = links.filter(l => !l.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menú"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Zapatería Jabibi</h1>
          <p>Sistema Administrativo</p>
        </div>
        <nav className="sidebar-nav">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        {usuario && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{usuario.nombre}</span>
                <span className="sidebar-user-role">{isAdmin ? '👑 Admin' : '👤 Usuario'}</span>
              </div>
              <button className="btn btn-icon btn-sm" onClick={logout} title="Cerrar sesión">
                🚪
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
