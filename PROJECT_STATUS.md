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
- [X] 🎬 **Demo** — Hay algo que se puede *enseñar*, pero NO sirve para usar de verdad.
- [ ] 🛠️ **Prototipo funcional** — Funciona en partes, pero no es fiable ni completo.
- [ ] 🚀 **MVP** — Versión mínima usable por usuarios reales, con lo justo para aportar valor.
- [ ] 🏭 **Producción** — En uso real, con datos reales y gente dependiendo de ello.

**Estado actual: 🎬 Demo (local).** Hay una web navegable con diseño oscuro y datos
de PRUEBA (inventados). Se puede enseñar y se entiende la visión, pero todavía NO
se pueden meter datos reales desde la interfaz (solo se puede marcar factura
pagada/pendiente). No hay usuarios ni seguridad todavía.

---

## 2. ✅ Qué funciona HOY

> Lista SOLO lo que se ha probado y funciona de verdad (verificado el 08/07/2026).

- **Web local** en `web/` (Next.js 16 + SQLite). Arranca con `npm run dev` y se ve en `http://localhost:3000`.
- **6 secciones navegables** con estilo oscuro y visual: Panel, Finanzas, Presupuestos, Facturas, Empresas, Productos.
- **Panel**: KPIs (beneficio del año, facturado, pendiente de cobro/pago) + comparativa anual + pedidos sin completar.
- **Finanzas**: rentabilidad por año, comparativa 2024/2025/2026 (gráfico + tabla), ingresos a recibir y gastos a pagar.
- **Facturas**: listado por fecha + **marcar pagada/pendiente funciona de verdad** (guarda en la base de datos).
- **Presupuestos**: doble tipo (gorros / congreso) y estado "completado" si tiene factura enlazada.
- **Empresas**: directorio jerárquico (matriz → delegaciones por país) con volumen facturado.
- **Productos**: catálogo flexible (gorros + otros) con precio y consumo de tela.
- Todo con **datos de prueba** realistas (Bausch, STAAR, Johnson, Quirón...) repartidos en 2024-2026.

---

## 3. ❌ Qué NO funciona todavía

- **Crear / editar** empresas, productos, presupuestos, facturas y gastos desde la web (ahora solo se cargan por el script de datos de prueba). Única edición disponible: marcar factura pagada/pendiente.
- **Datos reales**: aún son inventados. No se han importado los Excel reales.
- **Generador de presupuestos** (calculadora de consumo de tela, conversión presupuesto→factura automática).
- **Login / usuarios / permisos**: no hay seguridad; cualquiera con acceso al ordenador lo ve.
- **Publicación online**: solo funciona en local, no está en internet.
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
