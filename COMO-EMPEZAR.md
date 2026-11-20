# Cómo empezar (Windows)

## El flujo completo

1. **Instalar** lo necesario (una sola vez, unos 40 min).
2. **Preparar la carpeta** y correr las pruebas de la base con Docker.
3. **Crear** el repo en GitHub y el proyecto de Supabase.
4. **Abrir Claude Code** y pegarle el mensaje 1 → te muestra un plan.
5. **Llevarle el plan a Claude** (el chat orquestador) → te dice "dale" o qué corregir.
6. **Claude Code construye la Fase 0** → le llevas su resumen a Claude.
7. **Publicar** (nube, Vercel, tu usuario) y **probar en el celular**.

Después, cada lunes repites el ciclo de `SEGUIMIENTO.md`.

---

## 1. Instalar

| Qué | Cómo | Compruébalo en PowerShell |
| --- | --- | --- |
| Git para Windows | git-scm.com | `git --version` |
| Node LTS | nodejs.org, versión LTS | `node -v` → 20.9 o más |
| pnpm | `npm i -g pnpm` | `pnpm -v` |
| Docker Desktop | docker.com; acepta activar WSL2 y reinicia | `docker version` (con Docker Desktop abierto) |
| VS Code + Claude Code | Lo que ya usas | — |

El CLI de Supabase **no** se instala aparte: Claude Code lo agrega al proyecto en la Fase 0.

## 2. Preparar la carpeta

1. Descomprime `mamut-portal.zip` en una carpeta **fuera de OneDrive**, por ejemplo
   `C:\Users\<tú>\proyectos\mamut-portal` (OneDrive y `node_modules` se llevan mal).
2. En el Explorador, clic derecho en la carpeta → **Abrir en Terminal**.
3. Con Docker Desktop abierto, corre:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/probar-sql.ps1
   ```
   La primera vez descarga la imagen de Postgres. Al final debe decir
   **`OK: todas las pruebas del esquema pasaron`**. Si sale otra cosa, copia el error completo y llévaselo a Claude.

   **Sin Docker** (así arrancó la Fase 0, D-023): Claude Code corre las mismas pruebas contra la base de la
   nube dentro de una transacción que se deshace al final, y el CI de GitHub las corre en un Postgres limpio.

## 3. GitHub y Supabase

1. GitHub → **New repository** → nombre `mamut-portal`, **privado**, sin README. Copia la URL.
2. supabase.com → mira cuántos proyectos **activos** tienes. El plan gratis permite 2.
   Si ya tienes 2, dile a Claude cuáles son antes de pausar alguno.
3. Crea **un** proyecto: `mamut-portal`, región **São Paulo**. Guarda la contraseña de la base en un lugar seguro
   (nunca en el chat ni en el repo).

## 4 y 5. Claude Code: mensaje 1

1. Abre la carpeta en VS Code y abre Claude Code. Pon el modelo más capaz y el **modo plan** (Shift+Tab).
2. Pega esto:

```text
Hola. Este repo es el Portal Mamut: la administración de Mamut Herd (clientes, ventas, cobros,
comisiones, equipo, inventario y metas), en celular y PC, con tutorial guiado.
Estoy en Windows con PowerShell, Docker Desktop, Node LTS y pnpm. Ya corrí scripts/probar-sql.ps1 y pasa.

1. Lee CLAUDE.md, AGENTS.md, COMO-EMPEZAR.md, SEGUIMIENTO.md y todo docs/ (en especial PLAN, DESIGN,
   MODELO-DATOS, SEGURIDAD y DECISIONES D-011 a D-020).
2. Inicializa git en la rama main (yo creo el remoto en GitHub).
3. Ejecuta la Fase 0 de docs/PLAN.md, exactamente lo que dice "Construir".
   La marca de Mamut está en docs/mamut-herd/ (empieza por GUIA-DE-USO.md); no modifiques esa carpeta.
   No cambies las migraciones que ya existen salvo que una prueba lo exija (y anótalo en DECISIONES).
4. Primero muéstrame el plan: archivos, migraciones, pruebas, qué instalas, dónde va cada logo de Mamut
   y los riesgos. No escribas código hasta que te diga "dale".
   No avances a la Fase 1.
5. Al terminar: /verificar, BITACORA, actualiza SEGUIMIENTO.md y dime qué quedó, qué debo probar yo
   y qué quedó sin hacer.
```

3. Cuando muestre el plan, **cópialo completo y llévaselo a Claude** antes de decir "dale".
4. Al terminar, lleva a Claude el resumen final con la tabla de `/verificar`.

## 6. Después de la Fase 0 (lo haces tú, unos 20 min)

Claude Code revisa que estos pasos sigan sirviendo al final de la fase. Hazlos en este orden:

> Hecho el 2026-11-20 (BITACORA). El repo en GitHub se llama `Mamutherd_Portal` y la app quedó en
> `https://portalmamutherd.vercel.app`. Estos pasos quedan para repetirlos si algún día se rehace el proyecto.

1. **Subir el código a GitHub.** Pídele a Claude Code: "Conecta el remoto `<URL de GitHub>` y sube main".
   Los commits van con la cuenta de Mamut (`git config user.name/user.email` del repo).
2. **Base de datos en la nube.** Con el CLI de Supabase v3 basta la contraseña de la base
   (Supabase → Project Settings → Database). En PowerShell, en la carpeta:
   ```powershell
   $env:SUPABASE_DB_PASSWORD = '<contraseña de la base>'
   pnpm exec supabase db push --remote=<REF> --include-seed
   ```
   `<REF>` es el código que aparece en la URL de tu proyecto (`supabase.com/dashboard/project/<REF>`).
   `--include-seed` también corre `supabase/seed.sql`; no hace falta pegarlo en el SQL Editor.
   Las migraciones nuevas solo suben las que falten; correrlo dos veces no daña nada.
3. **Vercel.** vercel.com → **Add New → Project** → importa el repo **ya con código** (si lo importas vacío,
   queda como "Other": ve a Settings → Build and Deployment → Framework Preset → **Next.js**).
   En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API Keys; la "publishable key" `sb_publishable_…`), de tipo **Config**:
   son públicas a propósito y las protege RLS. **Nunca** pongas la `sb_secret_…` en Vercel.
   Luego **Deployments → ⋯ → Redeploy**. Copia la URL que te da.
4. **Correos de la cuenta.** Supabase → Authentication → **URL Configuration**: en **Site URL** pon la URL de
   Vercel; en **Redirect URLs** agrega esa URL, `…/entrar/nueva-clave` y `…/unirme`.
5. **Tu usuario de gerente.** Supabase → Authentication → Users → **Add user** con tu correo y contraseña
   (marca *Auto confirm*). Luego corre en **SQL Editor** (cambia el correo por el que usaste):
   ```sql
   update public.miembros
      set usuario_id = (select id from auth.users where email = 'TU-CORREO@gmail.com')
    where nombre = 'Jacobo López'
      and empresa_id = (select id from public.empresas where slug = 'mamut-herd');
   ```
   Si al entrar ves "Tu usuario aún no está en ningún equipo", este paso faltó o el correo no coincide.
6. **Prueba en el celular**: `docs/PLAN.md` → Fase 0 → "Prueba en el celular". Marca el resultado en
   `SEGUIMIENTO.md` y cuéntale a Claude.

Tus amigas vendedoras entran desde la Fase 3 con su invitación. Hasta entonces, si quieres registrar sus
ventas, agrégalas en **Table editor → miembros** con rol `ayudante`, forma de pago `comision` y sin usuario.

## 7. Recuerda

- Se construye **los lunes**. Hasta que la Fase 1 esté publicada, anota las visitas en una nota del celular
  con: negocio · dirección · dueño · WhatsApp · interés · próxima fecha. Luego las pasas al portal.
- Para cada fase nueva: `/siguiente-fase`. Al terminar el día: `/cerrar-sesion`.
- Si Claude Code propone cambiar el stack, el modelo de dinero, quitar RLS o usar la `service_role`
  en la app: no lo aceptes sin llevárselo a Claude.
- Nunca pegues contraseñas ni llaves en ningún chat.
