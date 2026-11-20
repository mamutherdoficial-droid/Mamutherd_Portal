# Portal Mamut

Administración gerencial de Mamut Herd, en el celular y en el PC: clientes por producto, ventas en curso, cobros y mensualidades,
equipo y tareas, comisiones, inventario de tags NFC y metas. Producto aparte de Tino, con la misma base.

- Empieza por **`COMO-EMPEZAR.md`** y lleva el orden en **`SEGUIMIENTO.md`**.
- Reglas para Claude Code: `CLAUDE.md`.
- Qué se construye y en qué orden: `docs/PLAN.md`.
- Base de datos: `supabase/migrations/` (pruebas: `scripts/probar-sql.ps1` en Windows o `bash scripts/probar-sql.sh`).

| Documento | Para qué |
| --- | --- |
| `docs/VISION.md` | Qué es, para quién, qué no es |
| `docs/ARQUITECTURA.md` | Stack, rutas, relación con Tino y Nef |
| `docs/MODELO-DATOS.md` | Tablas y reglas: comisiones, cobros, inventario, metas |
| `docs/DESIGN.md` | Estética de Mamut, pantallas, tutorial guiado, textos |
| `docs/mamut-herd/` | Kit de marca de Mamut Herd (logos, fuentes, colores, guía de uso) |
| `docs/SEGURIDAD.md` | Llaves, RLS, datos personales |
| `docs/PLAN.md` | Fases 0–5 con criterios, qué probar en el celular y el prompt de cada una |
| `docs/DECISIONES.md` | Por qué está hecho así |
| `docs/BITACORA.md` | Qué se hizo en cada sesión |
| `SEGUIMIENTO.md` | Tu tablero: fase actual, fechas y qué traerle a Claude |
