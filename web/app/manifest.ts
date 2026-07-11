import type { MetadataRoute } from "next";

// Manifiesto PWA: permite "Añadir a pantalla de inicio" en el móvil y tener
// un acceso directo a la Agenda (misma app, mismos datos).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lindilla · Gestión",
    short_name: "Lindilla",
    description: "Gestión de Lindilla S.L. — gorros de quirófano y Centroveo (óptica).",
    start_url: "/",
    display: "standalone",
    background_color: "#f6faf8",
    theme_color: "#16211e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Agenda de trabajo",
        short_name: "Agenda",
        description: "Apuntar consultas y cirugías del día",
        url: "/centroveo/agenda",
      },
      {
        name: "Centroveo",
        short_name: "Centroveo",
        url: "/centroveo",
      },
    ],
  };
}
