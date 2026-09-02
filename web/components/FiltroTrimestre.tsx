import Link from "next/link";

// Filtro de año + trimestre reutilizado en Facturas, Gastos y las pantallas
// de Centroveo. La vista principal es el trimestre; el año es solo para
// cambiar de periodo o ver el año completo.
export function FiltroTrimestre({
  basePath,
  anos,
  anoSel,
  trimestreSel,
  extraParams,
}: {
  basePath: string;
  anos: number[];
  anoSel: number;
  trimestreSel: number | null; // null = todo el año
  extraParams?: Record<string, string>;
}) {
  const url = (params: Record<string, string>) => {
    const q = new URLSearchParams({ ...extraParams, ...params });
    return `${basePath}?${q.toString()}`;
  };

  const pillCls = (activo: boolean) =>
    `px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
      activo
        ? "bg-[var(--accent-soft)] border-[rgba(78,143,132,.4)] text-[var(--brand-teal-dark)]"
        : "border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    }`;

  return (
    <div className="mb-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {anos.map((a) => (
          <Link key={a} href={url({ ano: String(a), trimestre: trimestreSel ? String(trimestreSel) : "todos" })} className={pillCls(a === anoSel)}>
            {a}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4].map((t) => (
          <Link key={t} href={url({ ano: String(anoSel), trimestre: String(t) })} className={pillCls(trimestreSel === t)}>
            {t}º trimestre
          </Link>
        ))}
        <Link href={url({ ano: String(anoSel), trimestre: "todos" })} className={pillCls(trimestreSel === null)}>
          Año completo
        </Link>
      </div>
    </div>
  );
}
