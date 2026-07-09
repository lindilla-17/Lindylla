// Traducción de estados a etiqueta visible + color de la etiqueta.

type Variant = "green" | "amber" | "rose" | "sky" | "indigo" | "slate";

export function estadoFactura(estado: string): { label: string; variant: Variant } {
  return estado === "PAGADA"
    ? { label: "Pagada", variant: "green" }
    : { label: "Pendiente de cobro", variant: "amber" };
}

export function estadoPresupuesto(estado: string): { label: string; variant: Variant } {
  switch (estado) {
    case "ACEPTADO":
      return { label: "Aceptado", variant: "green" };
    case "ENVIADO":
      return { label: "Enviado", variant: "sky" };
    case "RECHAZADO":
      return { label: "Rechazado", variant: "rose" };
    default:
      return { label: "Borrador", variant: "slate" };
  }
}

export function estadoGasto(estado: string): { label: string; variant: Variant } {
  return estado === "PAGADO"
    ? { label: "Pagado", variant: "green" }
    : { label: "Pendiente de pago", variant: "rose" };
}

export function tipoPresupuesto(tipo: string): { label: string; variant: Variant } {
  return tipo === "CONGRESO"
    ? { label: "Congreso", variant: "indigo" }
    : { label: "Pedido gorros", variant: "sky" };
}

// ¿El pedido está completado? Un presupuesto aceptado con factura emitida.
export function pedidoCompletado(estado: string, tieneFactura: boolean): boolean {
  return estado === "ACEPTADO" && tieneFactura;
}
