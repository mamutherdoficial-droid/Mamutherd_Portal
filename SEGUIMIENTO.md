# Seguimiento · Portal Mamut

Tu tablero para saber en qué vas y qué sigue. Claude Code lo actualiza al cerrar cada fase;
tú marcas las columnas "Probada en el celular" y "Revisada por Claude".

## Dónde vamos

| Fase | Fecha | Estado | Revisada por Claude | Probada en el celular |
| --- | --- | --- | --- | --- |
| 0 · Base, estética de Mamut, entrar, celular y PC | Vie 20 – dom 22 nov | En curso: publicada, falta la prueba en el celular | — | — |
| 1 · Clientes, ventas, Anotar visita, tutorial | Lun 23 nov | Pendiente | — | — |
| 2 · Cobros, mensualidades, comisiones | Lun 30 nov | Pendiente | — | — |
| 3 · Equipo, tareas, invitaciones | Lun 7 dic | Pendiente | — | — |
| 4 · Inventario, metas, Hoy completo, /semana | Lun 14 dic | Pendiente | — | — |
| 4b · Subir extracto y conciliar | Lun 21 dic | Pendiente | — | — |
| 5 · Para otros gerentes | Si pasa la puerta | Pendiente | — | — |

Estados: Pendiente · En curso · Cerrada · Pasa al lunes siguiente (con lo que falta en BITACORA).

## El ciclo de cada fase (cada lunes)

1. En Claude Code: **`/siguiente-fase`**. Revisa la fase anterior y te muestra el plan de la nueva.
2. **Copia el plan completo y llévaselo a Claude** (el chat). Claude lo compara con `docs/PLAN.md`.
3. Pega en Claude Code lo que Claude te devuelva: correcciones o "dale".
4. Claude Code construye y corre **`/verificar`**.
5. **Lleva el resumen final a Claude** (con la tabla de `/verificar`). Claude revisa los criterios y te dice
   qué probar en el celular.
6. **Prueba en el celular** lo que dice "Prueba en el celular" de esa fase en `docs/PLAN.md`.
7. Marca esta tabla y cierra con **`/cerrar-sesion`**.

## Qué le llevas a Claude

- El **plan** que muestra Claude Code, completo, antes de decir "dale".
- El **resumen final** con la tabla de `/verificar` y lo que quedó sin hacer.
- **Errores** con el texto completo (no solo "falló").
- **Capturas** si algo se ve mal en el celular o en el PC.
- Nunca contraseñas, llaves ni el contenido de `.env.local`.

## La semana

| Día | Qué |
| --- | --- |
| Lunes | Construir la fase del día (el ciclo de arriba) |
| Martes a sábado | Vender Nef. Anotar cada visita en el portal (o en la nota del celular hasta la Fase 1) |
| Domingo | Revisión de 15 minutos: metas, motivos de pérdida, cobros vencidos, pagos al equipo, inventario |

## Pendientes fuera del código

- [x] Kit de marca de Mamut dentro del repo (`docs/mamut-herd/`) y lienzo de diseño con la estética de Mamut.
- [ ] **Seguridad (hazlo pronto):** en Supabase, crear una secret key nueva y borrar la vieja; cambiar la
      contraseña de la base (las dos pasaron por el chat). Luego pásale la nueva secret key a Claude Code solo si
      vas a correr las pruebas e2e (va en `.env.test.local`, nunca en Vercel).
- [ ] Volver **privado** el repo de GitHub (Settings → General → Danger Zone → Change visibility).
- [ ] Opcional: instalar Docker Desktop para correr `probar-sql.ps1` y `supabase start` en local (D-023).
- [ ] Publicar la web de Mamut Herd y cambiar `MAMUT_HERD_URL` (en el kit de marca: `lib/marca.ts` lo lee de ahí).
- [ ] Antes de la Fase 3: correo de cada amiga vendedora y de tu hermana.
- [ ] Antes de la Fase 4b: un extracto real de Bancolombia y uno de Nequi (para los formatos) y, si quieres,
      la carpeta de tu conciliador Bold/Redeban.
- [ ] Mamut Herd SAS constituida: la necesita la fase 5 para los pagos que se marcan solos (D-018).
- [ ] Nombre comercial del portal (fase 5, D-009).

## Si algo se rompe

| Pasa esto | Haz esto |
| --- | --- |
| "Docker no responde" | Abre Docker Desktop, espera a que diga *running* y repite |
| `probar-sql.ps1` falla | Copia el error completo y llévaselo a Claude |
| Claude Code quiere cambiar el stack, el dinero, quitar RLS o usar `service_role` en la app | No aceptes; llévaselo a Claude |
| La fase no alcanzó el lunes | Que quede en BITACORA y abra el lunes siguiente antes de la fase nueva |
| Los correos de "Olvidé mi contraseña" llevan a `localhost` | Revisa el paso 6.4 de `COMO-EMPEZAR.md` |

## Enlaces

- Portal publicado: https://portalmamutherd.vercel.app
- Código: https://github.com/mamutherdoficial-droid/Mamutherd_Portal

- Lienzo de diseño: Portal Mamut · cómo se ve (en tus artifacts de Claude)
- Plan de ventas y acuerdos con ayudantes: en tus documentos de Claude
