# Diseño

## Principios

1. **Estética de Mamut Herd, no la de Tino.** El portal es un producto de Mamut y se ve como Mamut
   (D-011): tinta y hielo de base, el ámbar para una sola cosa por pantalla. Comparte con Tino la base técnica, no el aspecto.
2. **Se usa en la calle con una mano.** Lo frecuente (anotar visita, ver mi día, registrar pago)
   está a un toque desde `/hoy`, con botones de al menos 48 px de alto.
3. **Simple, no saturado.** Una pantalla = una pregunta ("¿qué hago hoy?", "¿quién me debe?").
   Nada de tableros con 12 gráficas. Números grandes y una frase.
4. **Lo que se entiende sin leer gráficas:** "Vas 9 de 15 visitas" con una barra, no un radar.
5. **Se aprende solo.** Nadie debería necesitar que Jacobo le explique: el tutorial guiado enseña
   cada pantalla la primera vez que se abre (ver "Tutorial guiado").
6. **Celular y PC son la misma app.** Mismo código y mismos datos; cambia el acomodo.

## Marca y tokens de Mamut Herd

El kit de marca está en **`docs/mamut-herd/`** (léelo completo, empezando por `GUIA-DE-USO.md`).
Colores, letras y logos salen de ahí; no se redibujan ni se inventan.

### Colores de la marca
Tinta `#0F1E2E` · Tinta 2 `#16293D` · Hielo `#EEF3F6` · Glaciar `#C5D9E6` · **Ámbar `#F5941F`** (acento, se usa poco).

### Tokens de la app (contraste revisado con WCAG)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--fondo` | `#EEF3F6` (Hielo) | `#0F1E2E` (Tinta) | Fondo de la app |
| `--superficie` | `#FFFFFF` | `#16293D` (Tinta 2) | Tarjetas, hojas, menú |
| `--tinta` | `#0F1E2E` | `#EEF3F6` | Texto principal (15:1) |
| `--tinta-suave` | `#4E6072` | `#9FB3C4` | Texto secundario (5,8:1 y 6,8:1) |
| `--borde` | `#D3E0E9` | `#24394F` | Bordes y divisores |
| `--principal` | `#0F1E2E` | `#EEF3F6` | Botón principal, selección, barras de meta (texto encima: el opuesto) |
| `--suave` | `#DDE8EF` | `#1E3349` | Chips seleccionados suaves, fondos de acento |
| `--glaciar` | `#C5D9E6` | `#2A4058` | Detalles, pista de las barras |
| `--ambar` | `#F5941F` | `#F5941F` | **Una sola cosa por pantalla**: el botón "Anotar visita", el punto de los hotspots |
| `--bien` | `#1F7A4D` | `#5CC48E` | Pagado, meta cumplida |
| `--alerta` | `#9A5200` | `#F5B25F` | Por vencer, stock bajo (más oscuro que el ámbar para no confundirse) |
| `--error` | `#B3261E` | `#F2857C` | Vencido, error |

Reglas de color:
- **Nunca texto ámbar sobre fondo claro** (2,1:1). Sobre ámbar va texto `#0F1E2E` (7,3:1).
- El ámbar no se usa para estados (pagado, vencido): esos tienen sus propios colores.

### Tipografía
- **Unbounded 800**: solo títulos de página (22–28 px) y el nombre "Portal Mamut". Es ancha: nunca en párrafos,
  botones ni números de tablas.
- **Manrope** (400, 500, 600, 700): todo lo demás. Números con `font-variant-numeric: tabular-nums`.
- Fuentes locales con `next/font/local` desde `docs/mamut-herd/fuentes/` (`unbounded-800.woff`,
  `manrope-var.woff`), copiadas a `app/fuentes/`. Licencia OFL (incluye los `OFL-*.txt`).
- Tamaños 13 / 15 / 17 / 22 / 28. Radio 12 px en tarjetas, 10 px en botones y campos; espaciado en pasos de 4.
- Íconos Lucide, 20 px, trazo 1.75. Montos con `Intl.NumberFormat('es-CO')`: `$200.000`.

### Logos en el portal (GUIA-DE-USO.md)
El portal es la herramienta interna de Mamut, así que aquí Mamut es el protagonista:

| Dónde | Logo | Versión |
| --- | --- | --- |
| `/entrar` | Logo horizontal | `para-fondo-claro` / `para-fondo-oscuro` según el tema |
| Menú lateral (PC) y cabecera | Símbolo + "Portal Mamut" en Unbounded | Según el tema |
| Favicon | `m` | `para-fondo-claro` |
| Ícono de la PWA | `perfil-oscuro.png` | — |
| `/ajustes/acerca` | Sello apilado + texto "Acerca de" y contacto de `MAMUT-HERD.md` | Según el tema |
| Pie de `/guia` y de la landing | Sello en línea (20–28 px de alto) | Según el tema |

- SVG en la web, copiados tal cual a `public/marca/`. Texto alternativo: "Mamut Herd" o "Un producto de Mamut Herd".
- Datos de la empresa (firma, contacto, derechos, `MAMUT_HERD_URL`) en un solo archivo `lib/marca.ts` hecho a partir
  de `mamut-herd.json`. "© 2026 Mamut Herd" donde vayan los derechos.
- El sello de miembro **no** se usa (es para empresas asociadas).
- Si en la fase 5 el portal recibe nombre comercial propio, cambia la regla: el producto lleva su marca y Mamut
  queda como firma "Un producto de Mamut Herd" (D-020).
- El prototipo de referencia (lienzo "Portal Mamut · cómo se ve") ya usa esta marca: copia su estructura y textos.

## Navegación

- **Celular:** barra inferior con 4 accesos: Hoy · Ventas · Cobros (gerente) o Comisiones (ayudante) · Más.
  Botón flotante **"+ Anotar visita"** en ámbar (texto tinta) en Hoy, Ventas y la ficha del cliente.
- **PC (desde 1024 px):** menú lateral con todas las secciones (Hoy, Ventas, Cobros, Equipo, Tareas,
  Inventario, Metas, Ajustes, Guía) y el nombre y rol del usuario abajo.
  "Anotar visita" se abre como panel lateral, no como hoja inferior.
- Entre 640 y 1024 px: barra inferior, contenido más ancho.

## Pantallas clave

### Entrar (`/entrar`)
Logo horizontal de Mamut Herd, "Portal Mamut" en Unbounded, campos **Correo** y **Contraseña** (con botón "Ver"), botón **"Entrar"**,
"Olvidé mi contraseña" (correo de Supabase para crear otra) y una caja: "¿Te invitaron al equipo? Abre el
enlace que te llegó y crea tu contraseña". Errores que dicen qué hacer ("Escribe tu correo completo").

### Hoy (`/hoy`)
1. Saludo y fecha: "Martes 24 de noviembre".
2. **Meta de la semana:** tres barras (visitas, dueños, clientes). "Vas 6 de 15 visitas".
3. **Seguimientos:** vencidos (en `--error`) y de hoy. Cada fila: negocio, próxima acción, botón WhatsApp.
4. **Tareas** de hoy.
5. Solo gerente: **"Por cobrar"** (total y número de cobros) y **"Por pagar a tu equipo"**.
- En PC: tarjetas de meta y totales en una fila; debajo, en dos columnas, seguimientos, ventas por etapa,
  equipo de la semana e inventario.

### Anotar visita (hoja inferior en celular, panel lateral en PC)
Campos en este orden, todo a un pulgar de distancia:
1. Negocio: buscador con los clientes existentes; si no existe, "Crear «Café Luna»" en la misma lista.
2. Producto (chips: Nef, Antesala…), preseleccionado el último usado.
3. "¿Hablaste con el dueño?" Sí / No (botones grandes).
4. Resultado (chips): Interesado · Pidió propuesta · Volver otro día · No le interesa.
5. Próxima acción + fecha (atajos: Mañana · En 3 días · Próxima semana · Sin fecha, con aviso).
6. Nota opcional. Botón **"Guardar"**.
Meta: menos de 20 segundos. Crea o actualiza cliente, oportunidad y actividad en una sola acción del servidor.

### Ventas (`/ventas`)
Lista agrupada por etapa (no tablero arrastrable en móvil). Filtros: producto, vendedor, "sin próxima fecha".
Cada tarjeta: negocio, producto, valor estimado, próxima fecha, vendedor y botón "Pasar a …".

### Cobros (`/cobros`)
Celular: pestañas Por cobrar · Vencidos · Pagados, tarjetas con **"Registrar pago de $X"** y WhatsApp.
PC: tabla (negocio, concepto, vence, saldo, estado, acción) y a la derecha el panel **"Conciliar con el banco"**
(Fase 4b). Botón **"Generar mensualidades de diciembre"** (el mes en curso).

### Mis comisiones (ayudante)
Arriba: "Te debemos $55.000" y "Ya te pagamos $120.000". Debajo, cada comisión con el negocio,
el concepto y el estado. Frase fija: "Tu comisión aparece cuando el negocio paga, no antes."

### Guía (`/guia`)
Los 5 pasos (entrar, anotar visita, mover ventas, registrar pago, revisar la semana), cada uno con
"Qué haces", "Qué ves" y "Truco", y el botón **"Hacer el recorrido otra vez"**.

## Tutorial guiado

Jacobo quiere que cualquiera entre y lo use solo. Se usan estas piezas (nombres de su glosario):

| Pieza | Qué es aquí | Cuándo aparece |
| --- | --- | --- |
| **Onboarding Tutorial** | Bienvenida de 3 pantallas al primer ingreso: qué es el portal, qué ves según tu rol, "vamos a anotar tu primera visita" | Primer ingreso de cada usuario |
| **Interactive Walkthrough** | El usuario hace la acción real guiado paso a paso (ej. anotar su primera visita de verdad) | Justo después de la bienvenida |
| **Product Tour** | Recorrido corto por una sección, la primera vez que se abre | Primera vez en Ventas, Cobros, Equipo, etc. |
| **Coach Marks** | Fondo oscurecido (tinta al 60%) con un recorte con borde ámbar que resalta el botón o zona de la que se habla | Dentro de los recorridos |
| **Tooltips** | Burbuja corta pegada a un botón ("Registra lo que ya entró por Nequi o el banco") | En cada paso y al mantener presionado un ícono |
| **Hotspots** | Punto ámbar que late sobre algo nuevo; al tocarlo explica y desaparece | Funciones nuevas de cada fase |

Reglas:
- Máximo 5 pasos por recorrido; cada paso, una frase de máximo 15 palabras.
- Siempre se puede **"Saltar"** y retomar desde `/guia` → "Hacer el recorrido otra vez".
- El avance se guarda por usuario en la base (tabla `recorridos_vistos`: usuario, recorrido, versión,
  completado_en), con RLS: cada quien solo ve el suyo. Si un recorrido cambia de versión, se vuelve a mostrar.
- Gerente y ayudante tienen recorridos distintos (la ayudante nunca ve pasos de cobros).
- Los pasos viven en un solo archivo (`lib/recorridos.ts`), no regados por las pantallas: así se revisan
  y se traducen fácil. Cada elemento resaltado lleva `data-recorrido="nombre"`.
- Accesible: el foco va al globo del paso, Esc salta, funciona con lector de pantalla y respeta
  `prefers-reduced-motion`. En celular el globo nunca tapa el botón resaltado.
- Componente propio o una librería pequeña (por ejemplo driver.js, licencia MIT); la decisión se anota en
  `DECISIONES.md`.

## Landing pública (Fase 5)

Página para otros gerentes con la estética de Mamut: portada, "Cómo se usa, en 5 pasos" interactivo,
tu semana con el portal, qué ve cada rol, comisiones con un ejemplo, "Cada vez más automático",
preguntas frecuentes y botón "Entrar". Sin testimonios, clientes ni cifras inventadas.

## Textos

- Tuteo, frases cortas, verbos concretos: "Anota la visita", "Registra el pago", "Ya te pagamos".
- Estados vacíos útiles: "Aún no hay visitas esta semana. La primera es la más difícil."
- Errores que dicen qué hacer: "Ese cobro ya está pagado. Si fue un error, anula el pago primero."
- Nunca "Error 500", "registro", "entidad" ni "transacción".
