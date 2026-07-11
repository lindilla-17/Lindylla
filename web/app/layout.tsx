import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lindilla · Gestión",
  description: "ERP/CRM de Lindilla S.L. — gorros de quirófano y Centroveo (óptica)",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Lindilla", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#16211e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full app-bg">
        <div className="flex min-h-screen">
          <Sidebar />
          {/* En móvil dejamos hueco arriba (barra con logo) y abajo (navegación) */}
          <main className="flex-1 min-w-0 pt-14 lg:pt-0 pb-20 lg:pb-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
