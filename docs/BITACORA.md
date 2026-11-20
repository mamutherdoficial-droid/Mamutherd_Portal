# Bitácora

La entrada más nueva va arriba. Formato:

```
## AAAA-MM-DD · Fase N · título corto
Hecho:
- …
Probado:
- comandos corridos y resultado
Falta:
- …
Para que Jacobo pruebe:
- pasos concretos en el celular
Dudas:
- …
```

## 2026-11-20 · Kit v2 (revisión con Claude antes de la Fase 0)
Hecho:
- Pruebas de la base movidas a `supabase/pruebas/`; `supabase/tests/` queda para pgTAP.
- `scripts/probar-sql.ps1` para Windows (Docker) y `.gitattributes` (saltos de línea de Linux en .sh y .sql).
- Migración `20261120000100_permisos_por_defecto.sql` y prueba de que `anon` no tiene permisos.
- Docs: estética de Mamut (no Tino), tutorial guiado, celular y PC, correo y contraseña con invitaciones,
  un solo proyecto en la nube, Fase 4b (extracto del banco), pasos para Jacobo en COMO-EMPEZAR y SEGUIMIENTO.md.
- Decisiones D-011 a D-020.
- Kit de marca de Mamut Herd en `docs/mamut-herd/` y tokens reales en `DESIGN.md` (contraste revisado).
Probado:
- `bash scripts/probar-sql.sh` en Postgres 16: migraciones y semilla dos veces sin error; todas las pruebas en verde.
- `probar-sql.ps1` no se pudo correr fuera de Windows: Jacobo lo corre en el paso 2 de COMO-EMPEZAR.
Falta:
- Todo el código de la app (fase 0 en adelante).
Dudas:
- Ninguna.

## 2026-11-19 · Kit inicial
Hecho:
- Documentos del proyecto, migración base (empresas, miembros, catálogo, clientes, oportunidades, actividades,
  suscripciones, cobros, pagos, comisiones, tareas, inventario, metas), RLS, vistas y semilla de Mamut Herd.
Probado:
- `bash scripts/probar-sql.sh`: migración y semilla dos veces sin error; pruebas de comisiones (25% instalación,
  10% mensualidad con tope de 6 meses, anulación), RLS de gerente y ayudantes, mensualidades idempotentes,
  inventario y metas. Todo en verde (Postgres 16 local).
Falta:
- Todo el código de la app (fase 0 en adelante).
Dudas:
- Ninguna.
