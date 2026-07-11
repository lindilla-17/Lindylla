# PROJECT_STATUS.md — Estado real del proyecto

> 🟢 **Este es el archivo más honesto del proyecto.**
> Aquí no se vende humo: dice qué funciona DE VERDAD hoy y qué no.
> Pensado para que cualquier persona —tú, un socio, un inversor— entienda
> el estado real en 30 segundos, sin saber nada de tecnología.
>
> **Regla de oro:** si algo no está aquí marcado como "funciona", asume que NO funciona.
> Una demo bonita NO es un producto. Documentación NO es código que funciona.
>
> Claude actualiza este archivo cada vez que cambia algo importante.
> Si ves que está desactualizado, pídele: *"Actualiza el PROJECT_STATUS"*.

---

## 1. Estado actual

> Marca con una **X** la casilla real. Solo una. Si dudas entre dos, elige la MENOR.
> ¿No sabes qué significa cada una? → lee [docs/ESTADOS_DEL_PROYECTO.md](docs/ESTADOS_DEL_PROYECTO.md)

- [ ] 💡 **Idea** — Solo existe la idea en tu cabeza o en notas sueltas.
- [ ] 📄 **Documentación** — Está escrito qué se quiere hacer, pero no hay nada construido.
- [ ] 🎬 **Demo** — Hay algo que se puede *enseñar*, pero NO sirve para usar de verdad.
- [ ] 🛠️ **Prototipo funcional** — Funciona en partes, pero no es fiable ni completo.
- [X] 🚀 **MVP (publicado online)** — Versión mínima usable, ya en internet con datos reales.
- [ ] 🏭 **Producción** — En uso real, con datos reales y gente dependiendo de ello.

**Estado actual: 🚀 MVP publicado (11/07/2026).** La web está **online en
`https://lindylla.vercel.app`** (Vercel), con base de datos real en la nube
(Supabase PostgreSQL). Carga datos reales (facturas, presupuestos, gastos
2023-2026), se pueden crear/editar/borrar facturas, y tiene la segunda actividad
(Centroveo) con su agenda. Hay DOS entornos separados: **producción** (Vercel +
Supabase "prod") y **desarrollo** (`localhost:3000` + Supabase "dev"). Todavía
SIN login/usuarios (cualquiera con el enlace la ve) — ese es el siguiente paso
antes de considerarlo "Producción" plena.

---

## 2. ✅ Qué funciona HOY

> Lista SOLO lo que se ha probado y funciona de verdad (verificado el 09/07/2026).

- **PUBLICADA ONLINE** en `https://lindylla.vercel.app` (Vercel), con base de datos real en Supabase (PostgreSQL). Verificado 11/07/2026: cargan panel, finanzas, facturas, empresas y Centroveo con datos reales.
- **Dos entornos separados**: producción (Vercel + Supabase `lindilla-prod`) y desarrollo (`localhost:3000` + Supabase `lindilla-dev`). El código es el mismo; cambia solo la base de datos (`DATABASE_URL`/`DIRECT_URL`). Deploy automático: cada push a `master` en GitHub republica.
- **Web local** en `web/` (Next.js 16 + PostgreSQL/Supabase). Arranca con `npm run dev` y se ve en `http://localhost:3000` (usa la base **dev**).
- **DATOS REALES**: 45 facturas, 40 presupuestos y 205 gastos extraídos de los PDFs de `Lindilla\cuentas` (2023-2026), cargados con `npx prisma db seed`. Exclusiones acordadas con Mercedes (coche, comisiones Amazon 2023, gastos personales) documentadas en `gastos-reales.json` (_pendientes).
- **Panel**: KPIs reales (beneficio del año, facturado, pendiente de cobro/pago) + comparativa anual + pedidos sin completar + **columna Centroveo** a la derecha.
- **Finanzas**: rentabilidad real por año (2023-2026), ingresos a recibir y gastos a pagar.
- **Facturas**: listado por año con ordenación, **crear desde la web** (numeración automática), editar, borrar, marcar pagada/pendiente e **imprimir con la plantilla de Lindilla**.
- **Presupuestos / Empresas / Productos / Gorros**: navegables con datos reales.
- **Centroveo (actividad sanitaria, NUEVO 09/07/2026)**: sección independiente con panel propio y 3 apartados — facturas emitidas (lentes de contacto, IVA 10%), facturas de proveedores y facturas de trabajos profesionales (optometría en Vithas Xanit, exentas de IVA). Crear, marcar cobrada/pagado y borrar funcionan y guardan en tablas separadas: sus datos NO se mezclan con la actividad de gorros.
- **Agenda de Centroveo (NUEVO 09/07/2026)**: calendario mensual (usable en móvil) para apuntar el trabajo diario. Las **actividades las define la usuaria** en /centroveo/actividades: nombre, **color a elegir**, si es **facturable** (con su precio) o solo un registro. Se pueden añadir todas las que quiera. Por defecto vienen Consulta, Cirugía de cataratas y Cirugía refractiva (colores distintos, editables). Con los precios puestos, calcula el importe del mes y, con un botón, genera la factura profesional del mes (exenta de IVA) sumando **solo lo facturable**. Verificado: apuntar → precios → facturar mes (excluye lo no facturable).
- **Logo de Centroveo**: la columna del panel muestra el logo automáticamente si existe `web/public/centroveo.png` (o .jpg/.svg/.webp). Aún NO añadido (falta el archivo).

---

## 3. ❌ Qué NO funciona todavía

- **Crear / editar** empresas, productos y presupuestos desde la web (facturas de gorros sí; los gastos de gorros solo se cargan por el script de datos).
- **Centroveo**: no tiene edición de facturas ya creadas (solo crear/borrar/marcar estado), ni impresión con plantilla, ni datos históricos cargados (empieza vacío).
- **Generador de presupuestos** (calculadora de consumo de tela, conversión presupuesto→factura automática).
- **Login / usuarios / permisos**: no hay seguridad. ⚠️ Ahora que está online, **cualquiera con el enlace `lindylla.vercel.app` puede verla y editarla**. Es lo MÁS urgente antes de meter datos sensibles de verdad.
- **Copias de seguridad automáticas** y gestión documental (logos/plantillas de clientes).

---

## 4. 🧪 Cómo probarlo

1. Abrir una terminal en la carpeta `web/`.
2. La primera vez: `npm install`, luego `npm run db:push` y `npm run db:seed` (crea y rellena la base de datos de prueba).
3. Ejecutar `npm run dev`.
4. Abrir en el navegador `http://localhost:3000`.
5. Qué deberías ver: el Panel con cifras, y al entrar en **Facturas** podrás pulsar "Marcar pagada" y ver cómo cambia y se actualizan los totales.

---

## 5. 🔚 Última decisión tomada

- **08/07/2026** — Construir la web como **código propio en local** (Next.js + base de datos SQLite en un archivo), en lugar de una plataforma no-code. Motivo: es lo que permite trabajar en local, verlo en el navegador y tener control total. Resuelve la decisión abierta **O1** del SYSTEM_VISION.

---

## 6. ⏭️ Próxima decisión necesaria

- **¿Empezamos a poder meter/editar datos reales desde la web** (formularios de alta), o **primero pulimos el diseño y qué información se muestra**? Decide: tú.

---

## 7. ⚠️ Riesgos abiertos

- **Datos de prueba vs reales**: no confundir las cifras actuales (inventadas) con la contabilidad real.
- **Sin seguridad todavía**: no meter datos reales sensibles hasta que haya login, y no publicar online sin auditar antes.
- **Migración de Excel** (decisión O2/O3 del SYSTEM_VISION): pendiente de definir cómo se cargan clientes, tarifas y >25 GB de recursos gráficos.

---

## 8. 🎯 Nivel de confianza del estado actual

- [X] 🟢 **Alto** — Lo he probado (las 6 páginas cargan sin errores y la acción de marcar pagada funciona).
- [ ] 🟡 **Medio**
- [ ] 🔴 **Bajo**

---

*Última actualización: 08/07/2026 por Claude (validar con Dirección Lindilla S.L.).*
*Mantiene: Claude (con validación del dueño del proyecto).*
