# Kit de marca de Mamut Herd

Este kit es para cualquier proyecto de Mamut Herd: los que ya existen y los que vengan. Tiene toda la información de la empresa, todos los logos y el código para mostrar que el proyecto es de Mamut Herd.

## Cómo agregarlo a un proyecto

1. Copia esta carpeta dentro del proyecto, por ejemplo en `docs/mamut-herd/`.
2. Abre Claude Code en ese proyecto y pégale el texto de `PROMPT-PARA-CLAUDE-CODE.md`.
3. Claude revisa el proyecto, te propone dónde poner el sello y la información de Mamut Herd, y lo agrega.

Si lo haces a mano, empieza por `GUIA-DE-USO.md`.

## Qué hay aquí

| Archivo o carpeta | Para qué sirve |
|---|---|
| `MAMUT-HERD.md` | Quién es Mamut Herd: textos listos para copiar (cortos y largos, en español e inglés), contacto, colores y tipografías. |
| `mamut-herd.json` | La misma información en un formato que el código puede leer directamente. |
| `GUIA-DE-USO.md` | Qué logo usar según el fondo, dónde va en una web o una app, y las reglas. |
| `PROMPT-PARA-CLAUDE-CODE.md` | El texto para pegarle a Claude Code en cada proyecto. |
| `logos/svg/` y `logos/png/` | Todos los logos de Mamut Herd. SVG para webs y PNG para apps. |
| `fuentes/` | Unbounded y Manrope, las tipografías de la marca (licencia libre OFL). |
| `intro/` | La animación del mamut en video, para el arranque de una app (opcional). |
| `codigo/` | El sello listo para pegar en HTML, React/Next.js, React Native, Android (Compose) y Flutter. |
| `muestra.png` | Cómo se ve el sello sobre distintos fondos. |

## Pendiente de llenar

`MAMUT_HERD_URL` aparece en el JSON, en el código y en el prompt. Cámbialo por la dirección de la web de Mamut Herd cuando esté publicada. Así también se actualiza en todos los proyectos que lean el JSON.
