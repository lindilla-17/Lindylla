"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  toggleActividadActiva,
} from "@/app/centroveo/actions";
import { PALETA } from "@/app/centroveo/trabajos";

type Actividad = {
  id: string;
  nombre: string;
  color: string;
  facturable: boolean;
  precio: number;
  marcaDia: boolean;
  activa: boolean;
};

// Selector de color: paleta de sugerencias + color libre
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PALETA.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${value.toLowerCase() === c.toLowerCase() ? "border-[var(--text)] scale-110" : "border-white shadow-sm"}`}
          style={{ background: c }}
          title={c}
        />
      ))}
      <label className="inline-flex items-center gap-1.5 ml-1 cursor-pointer" title="Elegir otro color">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-[var(--border)] bg-transparent p-0" />
        <span className="muted-2 text-[11px]">otro</span>
      </label>
    </div>
  );
}

// Fila editable de una actividad existente
function Fila({ act }: { act: Actividad }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(act.nombre);
  const [color, setColor] = useState(act.color);
  const [facturable, setFacturable] = useState(act.facturable);
  const [marcaDia, setMarcaDia] = useState(act.marcaDia);
  const [precio, setPrecio] = useState(act.precio ? String(act.precio).replace(".", ",") : "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cambiado =
    nombre !== act.nombre ||
    color.toLowerCase() !== act.color.toLowerCase() ||
    facturable !== act.facturable ||
    marcaDia !== act.marcaDia ||
    (parseFloat(precio.replace(",", ".")) || 0) !== act.precio;

  async function guardar() {
    setBusy(true); setMsg(null);
    const r = await actualizarActividad(act.id, { nombre, color, facturable, precio: parseFloat(precio.replace(",", ".")) || 0, marcaDia });
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    router.refresh();
  }
  async function borrar() {
    if (!confirm(`¿Borrar la actividad "${act.nombre}"?`)) return;
    setBusy(true); setMsg(null);
    const r = await eliminarActividad(act.id);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    router.refresh();
  }

  return (
    <div className={`card p-4 flex flex-col gap-3 ${!act.activa ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full flex-none" style={{ background: color }} />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] font-medium outline-none focus:border-[var(--brand-teal-dark)]"
        />
        {!act.activa && <span className="badge badge-slate flex-none">Desactivada</span>}
      </div>

      <ColorPicker value={color} onChange={setColor} />

      <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer">
        <input type="checkbox" checked={marcaDia} onChange={(e) => setMarcaDia(e.target.checked)} className="w-4 h-4 accent-[var(--brand-teal-dark)]" />
        Día completo (cuadro grande, sin número)
      </label>

      {!marcaDia && (
        <div className="flex items-center gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer">
            <input type="checkbox" checked={facturable} onChange={(e) => setFacturable(e.target.checked)} className="w-4 h-4 accent-[var(--brand-teal-dark)]" />
            Facturable
          </label>
          {facturable && (
            <div className="flex items-center gap-2">
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="w-24 text-right rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]"
              />
              <span className="muted text-[13px]">€ / ud.</span>
            </div>
          )}
        </div>
      )}

      {msg && <div className="text-[12px] text-[var(--tone-rose)]">{msg}</div>}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={guardar} disabled={busy || !cambiado}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-3.5 py-1.5 text-[13px] font-medium hover:opacity-90 disabled:opacity-40">
          {busy ? "..." : "Guardar"}
        </button>
        <button onClick={() => { setBusy(true); toggleActividadActiva(act.id).then(() => { setBusy(false); router.refresh(); }); }} disabled={busy}
          className="text-[13px] muted hover:text-[var(--text)] hover:underline disabled:opacity-50">
          {act.activa ? "Desactivar" : "Activar"}
        </button>
        <button onClick={borrar} disabled={busy}
          className="text-[13px] text-[var(--tone-rose)] hover:underline disabled:opacity-50 ml-auto">
          Borrar
        </button>
      </div>
    </div>
  );
}

// Formulario para añadir una actividad nueva
function Nueva() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(PALETA[3]);
  const [facturable, setFacturable] = useState(true);
  const [marcaDia, setMarcaDia] = useState(false);
  const [precio, setPrecio] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await crearActividad({ nombre, color, facturable, precio: parseFloat(precio.replace(",", ".")) || 0, marcaDia });
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    setNombre(""); setPrecio(""); setFacturable(true); setMarcaDia(false); setColor(PALETA[3]);
    router.refresh();
  }

  return (
    <form onSubmit={crear} className="card p-4 flex flex-col gap-3 border-dashed">
      <div className="font-semibold text-[14px]">Añadir actividad</div>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre (ej.: Peluquería, Uñas, Vacaciones...)"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]"
      />
      <ColorPicker value={color} onChange={setColor} />
      <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer">
        <input type="checkbox" checked={marcaDia} onChange={(e) => setMarcaDia(e.target.checked)} className="w-4 h-4 accent-[var(--brand-teal-dark)]" />
        Día completo (cuadro grande, sin número)
      </label>
      {!marcaDia && (
        <div className="flex items-center gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer">
            <input type="checkbox" checked={facturable} onChange={(e) => setFacturable(e.target.checked)} className="w-4 h-4 accent-[var(--brand-teal-dark)]" />
            Facturable
          </label>
          {facturable && (
            <div className="flex items-center gap-2">
              <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0,00" inputMode="decimal"
                className="w-24 text-right rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]" />
              <span className="muted text-[13px]">€ / ud.</span>
            </div>
          )}
        </div>
      )}
      {marcaDia ? (
        <p className="muted-2 text-[12px]">Día completo: marca el día entero con un cuadro de color (ej. Vacaciones). No lleva número ni se factura.</p>
      ) : !facturable ? (
        <p className="muted-2 text-[12px]">No facturable: se apunta en la agenda pero no suma a la factura del mes.</p>
      ) : null}
      {msg && <div className="text-[12px] text-[var(--tone-rose)]">{msg}</div>}
      <button type="submit" disabled={busy}
        className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 disabled:opacity-50 self-start">
        {busy ? "Añadiendo..." : "Añadir actividad"}
      </button>
    </form>
  );
}

export function ActividadesManager({ actividades }: { actividades: Actividad[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[820px]">
      {actividades.map((a) => <Fila key={a.id} act={a} />)}
      <Nueva />
    </div>
  );
}
