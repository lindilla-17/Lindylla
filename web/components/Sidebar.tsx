"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON = {
  panel: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10",
  finanzas: "M3 3v18h18M7 15l3-4 3 3 4-6",
  presupuestos: "M9 12h6M9 16h6M9 8h2M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z",
  facturas: "M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zM8 12h8M8 16h5M8 8h3",
  empresas: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 13h.01M15 13h.01",
  productos: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4",
  gorros: "M4 15a8 8 0 0116 0M4 15h16M4 15v3a1 1 0 001 1h14a1 1 0 001-1v-3M12 7V4M12 4h3",
  centroveo: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  agenda: "M8 2v3M16 2v3M3.5 9h17M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
};

// Menú completo (ordenador)
const nav = [
  { href: "/", label: "Panel", icon: ICON.panel },
  { href: "/finanzas", label: "Finanzas", icon: ICON.finanzas },
  { href: "/presupuestos", label: "Presupuestos", icon: ICON.presupuestos },
  { href: "/facturas", label: "Facturas", icon: ICON.facturas },
  { href: "/empresas", label: "Empresas", icon: ICON.empresas },
  { href: "/productos", label: "Productos", icon: ICON.productos },
  { href: "/gorros", label: "Gorros", icon: ICON.gorros },
  { href: "/centroveo", label: "Centroveo", icon: ICON.centroveo },
  { href: "/centroveo/agenda", label: "Agenda", icon: ICON.agenda },
];

// Los 5 accesos más usados (barra inferior del móvil)
const movil = [
  { href: "/", label: "Panel", icon: ICON.panel },
  { href: "/finanzas", label: "Finanzas", icon: ICON.finanzas },
  { href: "/facturas", label: "Facturas", icon: ICON.facturas },
  { href: "/centroveo", label: "Centroveo", icon: ICON.centroveo },
  { href: "/centroveo/agenda", label: "Agenda", icon: ICON.agenda },
];

function useActivo() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/centroveo") return pathname.startsWith("/centroveo") && !pathname.startsWith("/centroveo/agenda");
    return pathname === href || pathname.startsWith(href + "/");
  };
}

function Ico({ d, className = "ico" }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function Sidebar() {
  const activo = useActivo();

  return (
    <>
      {/* ---------- Menú lateral (ordenador) ---------- */}
      <aside className="hidden lg:flex w-[248px] flex-none border-r border-[var(--border)] bg-[var(--side)] flex-col sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-5">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Lindilla" className="h-14 w-auto" />
            <div>
              <div className="font-semibold text-[15px] leading-tight">Lindilla S.L.</div>
              <div className="muted-2 text-[12px] leading-tight">Gestión</div>
            </div>
          </Link>
        </div>

        <nav className="px-3 flex flex-col gap-1 mt-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${activo(item.href) ? "active" : ""}`}>
              <Ico d={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-5 py-5 border-t border-[var(--border-soft)]">
          <div className="muted-2 text-[11px] leading-relaxed">
            Datos reales (facturas 2023-2026)
            <br />
            Versión local · en desarrollo
          </div>
        </div>
      </aside>

      {/* ---------- Barra superior (móvil) ---------- */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center gap-2 px-4 bg-[var(--side)] border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Lindilla" className="h-9 w-auto" />
          <span className="font-semibold text-[15px]">Lindilla</span>
        </Link>
      </header>

      {/* ---------- Barra de navegación inferior (móvil) ---------- */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex items-stretch justify-around">
          {movil.map((item) => {
            const on = activo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[11px] font-medium transition-colors ${
                  on ? "text-[var(--brand-teal-dark)]" : "muted"
                }`}
              >
                <Ico d={item.icon} className={`w-6 h-6 ${on ? "" : "opacity-80"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
