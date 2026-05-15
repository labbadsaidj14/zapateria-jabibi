import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zapatería Jabibi - Sistema Administrativo",
  description: "Sistema de gestión de inventario, clientes y tickets para Zapatería Jabibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
