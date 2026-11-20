# Prompt para Claude Code

Copia la carpeta del kit dentro del proyecto (por ejemplo en `docs/mamut-herd/`) y pégale a Claude Code el texto que está entre las líneas. Sirve para cualquier proyecto: no hace falta cambiarle nada, salvo la ruta si pusiste el kit en otra carpeta.

---

Este proyecto es de **Mamut Herd**, la empresa que lo creó. Quiero que muestre que es un producto de Mamut Herd y que tenga a mano la información y los logos de la empresa.

En `docs/mamut-herd/` está el kit de marca:
- `MAMUT-HERD.md` y `mamut-herd.json`: la información de la empresa (textos, contacto, colores y tipografías).
- `GUIA-DE-USO.md`: qué logo usar según el fondo, dónde va y las reglas. **Léela completa antes de empezar.**
- `logos/svg` y `logos/png`: todos los logos. Cópialos tal cual; no los redibujes ni los edites.
- `codigo/`: el sello de ejemplo para web, React, React Native, Android Compose y Flutter.

Qué hacer:
1. Revisa el proyecto: qué es, en qué tecnología está, cómo organiza sus componentes y qué colores usa. Con eso dime en pocas líneas dónde vas a poner el sello y qué versión de color vas a usar, siguiendo la guía. Espera mi visto bueno antes de cambiar código.
2. Copia solo los logos que vas a usar a la carpeta de imágenes del proyecto. Usa SVG en web y PNG en apps.
3. Guarda la información de la empresa en un solo lugar del proyecto (una constante o un archivo de configuración, a partir de `mamut-herd.json`) para que el enlace, el correo y los textos se cambien en un solo sitio.
4. **Si el proyecto es una web:** pon el sello en línea en el pie de página, con enlace a la web de Mamut Herd (se abre en una pestaña nueva).
5. **Si el proyecto es una app:** pon el sello apilado en Ajustes > Acerca de, con el texto corto para "Acerca de" y el contacto de `MAMUT-HERD.md`. Si esa pantalla no existe, créala de forma sencilla con el estilo de la app.
6. Si la app o la web tiene modo claro y oscuro, el sello debe cambiar con el tema.
7. Ponle al sello el texto alternativo "Un producto de Mamut Herd" y que funcione como enlace accesible.
8. Donde el proyecto ponga sus derechos, deja "© 2026 Mamut Herd".
9. Si el proyecto tiene ficha en Google Play o App Store dentro del repo (por ejemplo, en una carpeta de metadatos), agrega al final de la descripción "Un producto de Mamut Herd."
10. No cambies nada de la marca del producto. El sello debe verse más pequeño que el logo del producto.
11. Si encuentras `MAMUT_HERD_URL` sin cambiar, avísame: es la dirección de la web de Mamut Herd y la tengo que dar yo.
12. Al final, compila o ejecuta el proyecto, revisa el resultado en celular y en escritorio (y en tema claro y oscuro, si los tiene) y dime qué archivos cambiaste.

---
