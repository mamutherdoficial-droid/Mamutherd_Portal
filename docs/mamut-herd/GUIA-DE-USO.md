# Guía de uso

## La regla de fondo

Cada producto de Mamut Herd conserva su nombre y su marca en grande. Mamut Herd aparece como **firma**: más pequeño, discreto y siempre en los mismos lugares.

## Qué logo usar

| Logo | Archivo | Para qué |
|---|---|---|
| **Sello en línea** | `un-producto-de-mamut-herd-linea-…` | El pie de página de las webs. Es el que más se usa. |
| **Sello apilado** | `un-producto-de-mamut-herd-apilado-…` | La pantalla "Acerca de" de las apps y los créditos. |
| **Logo horizontal** | `logo-horizontal-…` | Cuando Mamut Herd es el protagonista: su web, presentaciones, documentos. No va en los productos. |
| **Logo vertical** | `logo-vertical-…` | Igual que el horizontal, para espacios cuadrados o altos. |
| **Símbolo** | `simbolo-…` | El mamut solo, para espacios pequeños, junto al texto "Mamut Herd". |
| **m** | `m-…` | Íconos muy pequeños (favicon, ícono de una lista). |
| **Manada** | `manada-…` | Ilustración de tres mamuts para secciones sobre la comunidad. |
| **Sello de miembro** | `sello-miembro-…` | **Solo para las empresas asociadas**, no para los productos propios. |
| **Perfil** | `perfil-…` | Foto de perfil de redes sociales. |

## Qué color usar

Mira el fondo donde va a quedar el logo:

| El fondo es… | Usa la versión |
|---|---|
| Blanco o muy claro | `para-fondo-claro` |
| Oscuro (negro, azul noche, gris muy oscuro) | `para-fondo-oscuro` |
| Un color fuerte de la marca del producto (violeta, ciruela, azul, verde…) | `una-tinta-blanco` |
| Un color claro o plateado, o algo que se imprime en un solo color | `una-tinta-negro` |

- Si el producto tiene modo claro y oscuro, el logo cambia con él. Los componentes de `codigo/` ya lo hacen.
- Si la marca del producto pide no mezclar colores (por ejemplo, Antesala no lleva el ámbar de Mamut), usa las versiones de una tinta, que no tienen ámbar.

## Dónde va en cada proyecto

**Obligatorio**
1. **Webs:** el sello en línea en el pie de página, con enlace a la web de Mamut Herd. Alto: entre 20 y 28 px.
2. **Apps:** el sello apilado en **Ajustes > Acerca de**, debajo del nombre y la versión de la app, con el texto corto de `MAMUT-HERD.md` y el enlace. Ancho: entre 160 y 220 dp.
3. **Tiendas de apps (Google Play, App Store):**
   - Nombre del desarrollador: **Mamut Herd**.
   - Última línea de la descripción: **"Un producto de Mamut Herd."**
   - Sitio web del desarrollador: la web de Mamut Herd.
   - Correo de contacto: mamutherdoficial@gmail.com.
4. **Derechos:** "© 2026 Mamut Herd" donde el proyecto ponga sus derechos.

**Opcional**
- **Intro al abrir la app:** los videos de `intro/`. Menos de 2 segundos, solo la primera vez o con opción de saltarla, y sin animación si el sistema pide reducir el movimiento.
- **"Más de Mamut Herd":** una sección en "Acerca de" con enlaces a los otros productos.

## Reglas

**Tamaño mínimo**
- Sello en línea: 18 px de alto en web y 20 dp en apps.
- Sello apilado: 120 px o dp de ancho.
- Logo horizontal: 120 px de ancho.
- Si no cabe, usa el símbolo con el texto "Mamut Herd" al lado.

**Espacio libre:** alrededor del logo deja al menos la mitad de la altura del mamut sin otros textos ni íconos.

**Jerarquía:** dentro de un producto, el sello de Mamut Herd siempre es más pequeño que el logo del producto, como máximo un tercio de su tamaño.

**No hacer:**
- Cambiar los colores, salvo usar las versiones de una tinta.
- Estirar, rotar o recortar el logo.
- Ponerle sombras, brillos o degradados.
- Poner la versión de fondo claro sobre un fondo oscuro, o al revés.
- Reescribir "Un producto de" con otra letra. El texto ya viene dentro del archivo.
- Usar el sello de miembro en un producto propio. Ese es para las empresas asociadas.

**Formatos:** usa SVG en webs. En apps usa PNG: Android, Flutter y React Native no leen bien las máscaras de estos SVG.
