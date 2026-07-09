import { euro } from "@/lib/format";
import type { ResumenAnual } from "@/lib/finanzas";

// Gráfico de barras agrupadas: ingresos vs gastos por año (a medida, sin librerías).
export function YearChart({ data }: { data: ResumenAnual[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.ingresos, d.gastos]));

  return (
    <div>
      {/* Leyenda */}
      <div className="flex items-center gap-5 mb-6 text-[13px]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: "#4e8f84" }} /> Ingresos
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: "#e4056f" }} /> Gastos
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: "#16211e" }} /> Beneficio
        </span>
      </div>

      <div className="flex items-end justify-around gap-6 h-[240px] px-2">
        {data.map((d) => {
          const hIng = Math.round((d.ingresos / max) * 100);
          const hGas = Math.round((d.gastos / max) * 100);
          return (
            <div key={d.year} className="flex flex-col items-center gap-3 flex-1 h-full justify-end">
              <div className="flex items-end gap-2 h-full w-full justify-center">
                <Bar heightPct={hIng} color="#4e8f84" value={euro(d.ingresos)} />
                <Bar heightPct={hGas} color="#e4056f" value={euro(d.gastos)} />
              </div>
              <div className="text-center">
                <div className="text-[14px] font-semibold">{d.year}</div>
                <div className="text-[12px] font-semibold" style={{ color: "#16211e" }}>
                  {euro(d.rentabilidad)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({ heightPct, color, value }: { heightPct: number; color: string; value: string }) {
  return (
    <div className="group relative flex flex-col items-center justify-end h-full" style={{ width: 40 }}>
      {/* Valor encima de la barra */}
      <div className="absolute -top-5 text-[10px] muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {value}
      </div>
      <div
        className="w-full rounded-t-md transition-all"
        style={{
          height: `${heightPct}%`,
          background: `linear-gradient(180deg, ${color}, ${color}99)`,
          minHeight: 4,
        }}
      />
    </div>
  );
}
