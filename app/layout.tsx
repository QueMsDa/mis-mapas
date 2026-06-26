import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mis Mapas · Dispersión de Contaminantes",
  description: "Registro y visualización de dispersión de contaminantes atmosféricos usando el modelo de pluma gaussiana de Pfeiffer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
