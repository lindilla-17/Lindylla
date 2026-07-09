"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Panel", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/finanzas", label: "Finanzas", icon: "M3 3v18h18M7 15l3-4 3 3 4-6" },
  { href: "/presupuestos", label: "Presupuestos", icon: "M9 12h6M9 16h6M9 8h2M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" },
  { href: "/facturas", label: "Facturas", icon: "M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zM8 12h8M8 16h5M8 8h3" },
  { href: "/empresas", label: "Empresas", icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 13h.01M15 13h.01" },
  { href: "/productos", label: "Productos", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" },
  { href: "/gorros", label: "Gorros", icon: "M4 15a8 8 0 0116 0M4 15h16M4 15v3a1 1 0 001 1h14a1 1 0 001-1v-3M12 7V4M12 4h3" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[248px] flex-none border-r border-[var(--border)] bg-[var(--side)] flex flex-col sticky top-0 h-screen">
      {/* Marca */}
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

      {/* Navegación */}
      <nav className="px-3 flex flex-col gap-1 mt-1">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
              <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}

        {/* Centroveo: actividad sanitaria, gestión independiente */}
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          <div className="muted-2 text-[11px] font-semibold uppercase tracking-wide px-3 mb-1">Actividad sanitaria</div>
          <Link href="/centroveo" className={`nav-link ${pathname.startsWith("/centroveo") ? "active" : ""}`}>
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z M12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Centroveo
          </Link>
        </div>
      </nav>

      {/* Pie */}
      <div className="mt-auto px-5 py-5 border-t border-[var(--border-soft)]">
        <div className="muted-2 text-[11px] leading-relaxed">
          Datos reales (facturas 2023-2026)
          <br />
          Versión local · en desarrollo
        </div>
      </div>
    </aside>
  );
}
