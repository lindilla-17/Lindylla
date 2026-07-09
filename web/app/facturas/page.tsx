import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, ActionLink } from "@/components/ui";
import { estadoFactura } from "@/lib/estados";
import { PagadaToggle } from "@/components/PagadaToggle";
import { BorrarFacturaBtn } from "@/components/BorrarFacturaBtn";
import { estaEnCuentas, estaEnCarpetaEmpresa } from "@/lib/archivos";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const todas = await prisma.factura.findMany({
    include: { empresa: true, presupuesto: true },
    orderBy: { fecha: "desc" },
  });

  // Años disponibles (para las pestañas) y año seleccionado
  const anos = [...new Set(todas.map((f) => f.fecha.getFullYear()))].sort((a, b) => b - a);
  const anoParam = typeof params.ano === "string" ? parseInt(params.ano) : null;
  const anoSel = anoParam && anos.includes(anoParam) ? anoParam : null;

  // Ordenación: por fecha (defecto), empresa o número
  const orden = typeof params.orden === "string" && ["fecha", "empresa", "numero"].includes(params.orden) ? params.orden : "fecha";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const mult = dir === "asc" ? 1 : -1;

  const facturas = (anoSel ? todas.filter((f) => f.fecha.getFullYear() === anoSel) : todas)
    .slice()
    .sort((a, b) => {
      if (orden === "empresa") return mult * a.empresa.nombre.localeCompare(b.empresa.nombre, "es");
      if (orden === "numero") return mult * a.numero.localeCompare(b.numero, "es", { numeric: true });
      return mult * (a.fecha.getTime() - b.fecha.getTime());
    });

  // Construye el enlace de cabecera conservando el año; alterna asc/desc al repetir clic
  const linkOrden = (campo: string) => {
    const nuevaDir = orden === campo && dir === "desc" ? "asc" : "desc";
    const q = new URLSearchParams();
    if (anoSel) q.set("ano", String(anoSel));
    q.set("orden", campo);
    q.set("dir", campo === orden ? nuevaDir : "desc");
    return `/facturas?${q.toString()}`;
  };
  const flecha = (campo: string) => (orden === campo ? (dir === "desc" ? " ↓" : " ↑") : "");

  const total = facturas.reduce((s, f) => s + f.total, 0);
  const neto = facturas.reduce((s, f) => s + f.neto, 0);
  const iva = facturas.reduce((s, f) => s + f.iva, 0);
  const cobrado = facturas.filter((f) => f.estado === "PAGADA").reduce((s, f) => s + f.total, 0);
  const pendiente = total - cobrado;

  return (
    <Page>
      <PageHeader
        title="Facturas"
        subtitle="Facturas reales por fecha. El icono de carpetas indica si el PDF está en cuentas y en la carpeta de la empresa."
        action={<ActionLink href="/facturas/nueva">+ Nueva factura</ActionLink>}
      />

      {/* Pestañas por año */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <YearTab href="/facturas" label="Todos" active={anoSel === null} />
        {anos.map((a) => (
          <YearTab key={a} href={`/facturas?ano=${a}`} label={String(a)} active={anoSel === a} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard label={`Base sin IVA ${anoSel ?? "total"}`} value={euro(neto)} tone="sky" sub={`${facturas.length} facturas`} />
        <StatCard label="IVA repercutido" value={euro(iva)} tone="indigo" sub="solo ventas España (21%)" />
        <StatCard label="Total con IVA" value={euro(total)} />
        <StatCard label="Cobrado" value={euro(cobrado)} tone="green" />
        <StatCard label="Pendiente de cobro" value={euro(pendiente)} tone="amber" />
      </div>

      <Panel title={`Listado (${facturas.length})`}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>
                  <Link href={linkOrden("numero")} className="hover:text-[var(--text)]">Nº{flecha("numero")}</Link>
                </th>
                <th>
                  <Link href={linkOrden("empresa")} className="hover:text-[var(--text)]">Cliente{flecha("empresa")}</Link>
                </th>
                <th>Concepto</th>
                <th>
                  <Link href={linkOrden("fecha")} className="hover:text-[var(--text)]">Fecha{flecha("fecha")}</Link>
                </th>
                <th className="text-right">Sin IVA</th>
                <th className="text-right">IVA</th>
                <th className="text-right">Total</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => {
                const e = estadoFactura(f.estado);
                const enCuentas = estaEnCuentas(f.archivo, f.fecha.getFullYear());
                const enEmpresa = estaEnCarpetaEmpresa(f.archivo, f.empresa.carpeta);
                return (
                  <tr key={f.id}>
                    <td className="font-mono text-[13px] muted whitespace-nowrap">{f.numero}</td>
                    <td className="font-medium whitespace-nowrap">{f.empresa.nombre}</td>
                    <td className="muted text-[13px] max-w-[300px]">
                      {f.concepto ?? "—"}
                      {f.notas && <div className="muted-2 text-[11px] mt-0.5">⚠ {f.notas}</div>}
                    </td>
                    <td className="muted whitespace-nowrap">{fecha(f.fecha)}</td>
                    <td className="text-right whitespace-nowrap">{euroExacto(f.neto)}</td>
                    <td className="text-right whitespace-nowrap">
                      {f.iva !== 0 ? <span className="muted">{euroExacto(f.iva)}</span> : <span className="muted-2 text-[12px]">sin IVA</span>}
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap">{euroExacto(f.total)}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <FileBadge ok={enCuentas} label="Cuentas" />
                        <FileBadge ok={enEmpresa} label="Empresa" />
                      </div>
                    </td>
                    <td><Badge variant={e.variant}>{e.label}</Badge></td>
                    <td className="text-right whitespace-nowrap">
                      <PagadaToggle id={f.id} pagada={f.estado === "PAGADA"} />
                      <div className="mt-1 flex gap-2 justify-end text-[12px]">
                        <Link href={`/facturas/${f.id}/imprimir`} className="text-[var(--brand-teal-dark)] hover:underline">Ver</Link>
                        <Link href={`/facturas/${f.id}/editar`} className="muted hover:underline">Editar</Link>
                        <BorrarFacturaBtn id={f.id} numero={f.numero} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </Page>
  );
}

function YearTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
        active
          ? "bg-[var(--accent-soft)] border-[rgba(78,143,132,.4)] text-[var(--brand-teal-dark)]"
          : "border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );
}

function FileBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${ok ? "text-[var(--tone-green)]" : "text-[var(--tone-rose)]"}`}
      title={ok ? `PDF encontrado en la carpeta de ${label.toLowerCase()}` : `PDF NO encontrado en la carpeta de ${label.toLowerCase()}`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}
