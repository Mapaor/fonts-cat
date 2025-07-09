import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonts de Catalunya - Mapa interactiu",
  description: "Mapa interactiu de les fonts d'aigua potable de Catalunya obtingudes d'OpenStreetMap",
  keywords: ["fonts", "Catalunya", "aigua", "potable", "mapa", "OpenStreetMap"],
  authors: [{ name: "Fonts Catalunya" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>
        {children}
      </body>
    </html>
  );
}
