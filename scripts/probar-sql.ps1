# Pruebas de la base en Windows, con Docker (no necesitas Postgres instalado).
# Corre el mismo scripts/probar-sql.sh dentro de un contenedor de Postgres:
# migraciones y semilla dos veces + supabase/pruebas/base_test.sql.
# Nunca toca la base de `supabase start`.
# Uso, en la carpeta del proyecto:
#   powershell -ExecutionPolicy Bypass -File scripts/probar-sql.ps1
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

# Misma versión mayor de Postgres que Supabase (supabase/config.toml); 17 si aún no existe.
$version = '17'
$config = Join-Path $raiz 'supabase/config.toml'
if (Test-Path $config) {
  $m = Select-String -Path $config -Pattern '^\s*major_version\s*=\s*(\d+)' | Select-Object -First 1
  if ($m) { $version = $m.Matches[0].Groups[1].Value }
}

docker version *> $null
if ($LASTEXITCODE -ne 0) { Write-Host 'Docker no responde. Abre Docker Desktop y vuelve a intentar.'; exit 1 }

$cmd = "mkdir /tmp/r && cp -r /repo/scripts /repo/supabase /tmp/r/ && sed -i 's/\r$//' /tmp/r/scripts/*.sh && chown -R postgres /tmp/r && cd /tmp/r && gosu postgres bash scripts/probar-sql.sh"
docker run --rm -v "${raiz}:/repo:ro" "postgres:$version" bash -c $cmd
exit $LASTEXITCODE
