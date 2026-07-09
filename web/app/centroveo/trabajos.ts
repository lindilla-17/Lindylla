// Actividades por defecto de la agenda (solo se crean la primera vez;
// luego la usuaria puede editarlas, cambiar color, precio, o añadir más).
// Colores de arranque bien diferenciados; son editables desde la web.
export const ACTIVIDADES_DEFECTO = [
  { nombre: "Consulta", color: "#2563eb", facturable: true }, // azul
  { nombre: "Cirugía de cataratas", color: "#e4056f", facturable: true }, // fucsia (marca)
  { nombre: "Cirugía refractiva", color: "#d97706", facturable: true }, // ámbar
];

// Paleta sugerida para el selector de color (además del color libre)
export const PALETA = [
  "#2563eb", "#e4056f", "#d97706", "#16a34a", "#7c3aed",
  "#0891b2", "#dc2626", "#4e8f84", "#ca8a04", "#64748b",
];
