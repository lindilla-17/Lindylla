# Despliegue de Lindilla a producción (Vercel + Neon)

Guía práctica del montaje. Objetivo:

- **Producción**: la web publicada en internet (Vercel), con su base de datos real.
- **Desarrollo (localhost)**: tu ordenador, con una base de datos aparte para trastear
  sin tocar los datos reales.

Ambos entornos usan **PostgreSQL en Neon** (gratis). El código es el mismo; lo único que
cambia es a qué base de datos apunta cada uno (variable `DATABASE_URL`).

---

## Resumen de piezas

| Pieza | Para qué | Cuenta |
|-------|----------|--------|
| GitHub | Guarda el código (ya existe: `lindilla-17/Lindylla`) | ya la tienes |
| Neon | Base de datos en la nube (prod + dev) | crear |
| Vercel | Publica la web y la conecta a GitHub | crear |

En Vercel, el proyecto apunta a la subcarpeta **`web`** (Root Directory = `web`).

---

## Qué hace el despliegue automáticamente

- `npm install` → instala dependencias.
- `prisma generate` → prepara el cliente de base de datos (en el `build`).
- `next build` → compila la web.

La base de datos se prepara una sola vez con `prisma db push` + `prisma db seed`
(lo hace el desarrollador contra cada base de datos: dev y prod).

---

## Variables de entorno

- `DATABASE_URL` — cadena de conexión de Neon.
  - Local: en `web/.env` (base de datos **dev**).
  - Vercel: en Settings → Environment Variables (base de datos **prod**).

Nunca se sube `.env` a GitHub.
