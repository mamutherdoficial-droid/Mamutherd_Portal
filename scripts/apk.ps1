# Arma el APK de la app Android del Portal Mamut (D-029). Todo queda en el disco D.
# Uso, en la carpeta del proyecto:
#   powershell -ExecutionPolicy Bypass -File scripts/apk.ps1
# El APK queda en: android\app\build\outputs\apk\debug\app-debug.apk
# Solo hace falta volver a armarlo si cambia algo nativo (ícono, nombre, plugins).
# Los cambios del portal llegan solos desde Vercel.
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

$env:JAVA_HOME = 'D:\androidstudio\jbr'       # Java de Android Studio
$env:GRADLE_USER_HOME = 'D:\.gradle'           # caché de Gradle en D, nunca en C
$env:ANDROID_HOME = 'D:\Android\sdk'

if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) { Write-Host "No encuentro Java en $env:JAVA_HOME"; exit 1 }
if (-not (Test-Path $env:ANDROID_HOME)) { Write-Host "No encuentro el SDK de Android en $env:ANDROID_HOME"; exit 1 }

Set-Location $raiz
pnpm exec cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location (Join-Path $raiz 'android')
if (-not (Test-Path 'local.properties')) { 'sdk.dir=D\:/Android/sdk' | Out-File -Encoding ascii 'local.properties' }
.\gradlew.bat assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apk = Join-Path $raiz 'android\app\build\outputs\apk\debug\app-debug.apk'
Write-Host ""
Write-Host "Listo: $apk"
Write-Host "Pásalo al celular (cable, Drive o WhatsApp) e instálalo."
