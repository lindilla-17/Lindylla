# Lessons Learned — Log de lecciones aprendidas

> Este archivo es la memoria persistente del proyecto.
> Claude lo lee al inicio de cada sesión para no repetir errores.
> **No borrar entradas antiguas** — son el historial de aprendizaje.

---

## Cómo añadir una lección

Di a Claude: `/nueva-leccion`
O directamente: *"Anota esto como lección aprendida: [descripción]"*

## Formato estándar

```markdown
## YYYY-MM-DD HH:MM — [Título corto]

**Error o aprendizaje:** [Qué pasó]
**Causa raíz:** [Por qué ocurrió]
**Lección:** [Qué hacer diferente en el futuro]
**Contexto:** [Dónde aplica — siempre, en ciertos módulos, etc.]
```

---

<!-- Las lecciones se añaden debajo de esta línea -->

## 2026-07-11 — Migración de base de datos: NO olvidar los datos que solo viven en la BD

**Qué pasó:** Al migrar de SQLite (local) a Supabase (PostgreSQL) para el deploy,
sembré prod/dev con los JSON (facturas, gastos, presupuestos, actividades) pero
me dejé fuera los **apuntes de la agenda de Centroveo** (`CentroveoTrabajo`), que
solo existían en la BD (no en ningún JSON). Mercedes había metido 39 apuntes de
julio + vacaciones y "desaparecieron" al cambiar el localhost a Supabase.

**Causa raíz:** El seed solo reconstruye lo que está en JSON. Los datos creados
por la usuaria desde la web (apuntes, facturas creadas en la UI, estados) viven
SOLO en la base de datos. Una migración de motor de BD debe MIGRAR los datos,
no re-sembrar desde los JSON.

**Cómo se recuperó:** El archivo `web/prisma/dev.db` (SQLite) seguía en disco.
Leído con `node:sqlite`, mapeando cada apunte a su actividad por NOMBRE (los IDs
cambian entre bases) y reinsertado en dev y prod.

**Lección / cómo aplicar:**
1. Antes de CUALQUIER migración de BD, exportar TODOS los datos de usuario
   (no solo los sembrables por JSON): apuntes, facturas UI, estados de cobro/pago.
2. Nunca borrar/reemplazar `dev.db` tras migrar hasta confirmar que todo está en
   el destino.
3. Un `db seed` NO es una migración de datos: solo repone los datos semilla.
