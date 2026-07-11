import Link from "next/link";
import React from "react";

/* Cabecera de página */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="muted text-[14px] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* Contenedor de página con padding estándar */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-4 sm:px-8 py-5 sm:py-7 max-w-[1280px] mx-auto">{children}</div>;
}

/* Tarjeta de KPI grande y visual */
export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: "default" | "green" | "amber" | "rose" | "sky" | "indigo";
  icon?: React.ReactNode;
}) {
  const toneColor: Record<string, string> = {
    default: "var(--text)",
    green: "var(--tone-green)",
    amber: "var(--tone-amber)",
    rose: "var(--tone-rose)",
    sky: "var(--tone-sky)",
    indigo: "var(--tone-indigo)",
  };
  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="muted text-[13px] font-medium">{label}</span>
        {icon && <span className="muted-2">{icon}</span>}
      </div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight" style={{ color: toneColor[tone] }}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[13px] muted">{sub}</div>}
    </div>
  );
}

/* Panel/tarjeta genérica con título */
export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[15px]">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/* Etiqueta de estado con punto de color */
export function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "green" | "amber" | "rose" | "sky" | "indigo" | "slate";
}) {
  const dotColor: Record<string, string> = {
    green: "var(--tone-green)",
    amber: "var(--tone-amber)",
    rose: "var(--tone-rose)",
    sky: "var(--tone-sky)",
    indigo: "var(--tone-indigo)",
    slate: "#94a3b8",
  };
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" style={{ background: dotColor[variant] }} />
      {children}
    </span>
  );
}

/* Botón/enlace de acción */
export function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-soft)] border border-[rgba(78,143,132,.3)] text-[var(--brand-teal-dark)] px-3.5 py-2 text-[13px] font-medium hover:bg-[rgba(78,143,132,.22)] transition-colors"
    >
      {children}
    </Link>
  );
}

/* Estado vacío */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center muted text-[14px]">{children}</div>;
}
