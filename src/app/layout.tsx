import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import AppGuard from "@/components/AppGuard";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Zapatería Jabibi - Sistema Administrativo",
  description: "Sistema de gestión de tickets y clientes",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zapatería Jabibi',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AppGuard>
            {children}
          </AppGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
