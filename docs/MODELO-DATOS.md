# Modelo de datos

El esquema completo está en `supabase/migrations/20261120000000_base.sql` y se prueba con
`scripts/probar-sql.ps1` (Windows) o `bash scripts/probar-sql.sh` (Linux/CI). Este documento explica **para qué** es cada tabla y las reglas.

## Mapa

```
empresas ─┬─ miembros (gerente | ayudante; usuario_id null = sin acceso aún)
          ├─ productos ── planes (unico | mensual; precio null = se cotiza)
          ├─ clientes ─┬─ oportunidades ── oportunidad_vendedores (quién comisiona y cuánto)
          │            ├─ actividades (visita, whatsapp, demo, instalación…)
          │            ├─ suscripciones ── cobros (mensualidad por mes)
          │            └─ cobros (instalación, fotos, piloto…) ── pagos ──▶ comisiones (trigger)
          ├─ reglas_comision (atribución × concepto → %; meses_max para mensualidad)
          ├─ tareas (asignada_a; valor_trabajo = pago por trabajo)
          ├─ inventario_items ── inventario_movimientos (+ compra, − instalación/daño)
          └─ metas (semana, miembro?, producto?, indicador, objetivo)
```

## Reglas de negocio

### Oportunidades
- Etapas: `prospecto → contactado → demo → propuesta → ganada | perdida`.
- `perdida` exige `motivo_perdida` (sirve para corregir el guion cada domingo).
- **Solo un gerente marca `ganada`** (RLS lo bloquea a ayudantes). Se marca al recibir el primer pago;
  la app sugiere marcarla cuando se registra el anticipo de la instalación.
- `proxima_accion` + `proxima_fecha` alimentan `/hoy`. Toda oportunidad abierta debería tener próxima fecha:
  la app la pide al anotar una visita.

### Atribución y comisiones
- Cada oportunidad puede tener 0..n vendedores en `oportunidad_vendedores` con:
  - `atribucion`: `propia` (la consiguió ella), `conjunta` (salida juntos, Jacobo cierra), `referido` (solo pasó el contacto).
  - `parte`: proporción (1 = toda; 0,5 si dos personas hablaron con el mismo negocio).
- Reglas de Mamut (semilla): propia 25% instalación + 10% mensualidad × 6 meses; conjunta 15% instalación;
  referido 10% instalación.
- **El trigger `generar_comisiones` crea las comisiones cuando entra un pago**, proporcional al pago
  (si pagan el 50%, se comisiona el 50%). Fórmula: `floor(pago × % × parte)`.
- Para mensualidad, cuenta **meses distintos** ya comisionados; al llegar a `meses_max` deja de comisionar.
- Si se anula un pago, sus comisiones **pendientes** pasan a `anulada`. Si ya estaban **pagadas**,
  la app debe mostrar una alerta al gerente para descontarlo del siguiente pago (fase 2).
- Pagar comisiones: el gerente marca `estado = 'pagada'`, `pagada_en` y `medio_pago`.

### Cobros y mensualidades
- `cobros` = lo que el cliente debe; `pagos` = lo que entró (puede haber varios pagos por cobro).
- Estado calculado en `v_cobros`: `pendiente | parcial | pagado | vencido | anulado`, con `pagado` y `saldo`.
- `suscripciones.precio_mensual` se congela al firmar (fundadores conservan su precio 12 meses).
- `generar_mensualidades(empresa, mes)` crea un cobro por suscripción activa; es idempotente
  (índice único por suscripción y periodo). Botón en `/cobros` el día 1 de cada mes.

### Trabajos de ayudantes (pago por trabajo)
- Una tarea con `valor_trabajo` (ej. sesión de fotos) aparece en `v_por_pagar_ayudantes` cuando está `hecha`
  y `trabajo_pagado_en` es null.
- Una ayudante puede marcar su tarea `hecha`, pero no cambiar el valor, el pago ni a quién está asignada
  (trigger `proteger_tarea`).

### Inventario
- `cantidad` con signo: compra (+), asignación/instalación/daño (−), ajuste (±).
- `v_inventario` da `stock` y `bajo` (stock ≤ mínimo). Ítems de la semilla: sticker NTAG213 (mín. 20),
  soporte de mesa (mín. 6), placa de caja (mín. 1).
- Al cerrar una instalación, la app propone el movimiento (ej. −7 stickers, −6 soportes, −1 placa).

### Metas
- Por semana (lunes), opcionalmente por miembro y por producto.
- Indicadores: `visitas`, `conversaciones_dueno` (de `actividades`), `clientes_nuevos` (oportunidades ganadas
  en la semana) e `ingresos` (pagos de la semana). Avance en `v_avance_metas`.

## Vistas

| Vista | Para |
| --- | --- |
| `v_cobros` | Estado, pagado y saldo de cada cobro |
| `v_inventario` | Stock y alerta |
| `v_por_pagar_ayudantes` | Comisiones pendientes + trabajos hechos sin pagar |
| `v_avance_metas` | Logrado contra objetivo |

Todas con `security_invoker = true`: respetan la RLS de quien consulta.

## Tablas que llegan en fases siguientes

| Tabla | Fase | Para |
| --- | --- | --- |
| `recorridos_vistos` | 1 | Qué recorridos del tutorial completó cada usuario (usuario, recorrido, versión, completado_en) |
| `invitaciones` | 3 | Token (hash), miembro, vence_en, usada_en; la usa `aceptar_invitacion` |
| `extractos`, `movimientos_banco` | 4b | Extractos subidos y cada movimiento con su huella, propuesta y estado |

También en la fase 2: trigger que llena `oportunidades.cerrada_en` al pasar a `ganada` o `perdida`.

### Mapa y rutas (fase 1b)
- `clientes.lat` / `lng` (las dos o ninguna), `ubicacion_fuente` (`gps`, `mapa`, `enlace`) y `ubicado_en`.
  Es la ubicación **del negocio**; nunca se guarda dónde está una persona del equipo (D-046).
- `rutas`: una salida de una persona en un día (`fecha` en hora de Bogotá), con `modo` y la última línea calculada
  (`geometria`, `distancia_m`, `duracion_s`) como caché. Se borran con `borrado_en`.
- `ruta_paradas`: negocio + `orden` + `estado` (`pendiente`, `visitada`, `saltada`). Un negocio va una vez por ruta.
  Ruta, parada y negocio deben ser de la misma empresa (trigger `validar_parada`).
- **Anotar una visita marca la parada sola:** al insertar una actividad `visita`, `demo` o `instalacion`, el trigger
  `marcar_parada_visitada` busca la ruta de **esa persona** para **ese día** y marca la parada pendiente de ese negocio.
  La app no tiene que hacer nada más.
- `reordenar_ruta(ruta, ids[])` cambia el orden de todas las paradas en una sola operación; exige la lista completa.
- Ayudante: ve y edita solo sus rutas; solo agrega negocios que puede ver; quita solo paradas pendientes.
