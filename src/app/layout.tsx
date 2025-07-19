import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonts de Catalunya",
  description: "Mapa interactiu de les fonts d'aigua potable de Catalunya. Dades obtingudes d'OpenStreetMap",
  keywords: ["fonts", "Catalunya", "aigua", "potable", "mapa", "OpenStreetMap"],
  authors: [{ name: "Fonts Catalunya" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Fonts de Catalunya",
    description: "Mapa interactiu de les fonts d'aigua potable de Catalunya. Dades obtingudes d'OpenStreetMap",
    url: "https://fonts-cat.vercel.app",
    images: [
      {
        url: "https://fonts-cat.vercel.app/banner-mapa.png",
        width: 1200,
        height: 630,
        alt: "Fonts Catalunya Banner",
      },
    ],
    siteName: "Fonts Catalunya",
    type: "website",
    locale: "ca_ES",
  },
  metadataBase: new URL("https://fonts-cat.vercel.app"),
  alternates: {
    canonical: "https://fonts-cat.vercel.app",
  },
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
