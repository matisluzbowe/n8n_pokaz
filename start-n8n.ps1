# ============================================================
#  Uruchamianie lokalnego serwera n8n
#  Uzywa przenosnej wersji Node.js (bez uprawnien administratora)
# ============================================================

$ErrorActionPreference = "Stop"

# Folder z przenosnym Node.js i danymi n8n (poza OneDrive)
$runtime = Join-Path $env:LOCALAPPDATA "n8n-runtime"
$nodeDir = Join-Path $runtime "node"

if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
    Write-Host "Nie znaleziono Node.js w: $nodeDir" -ForegroundColor Red
    Write-Host "Uruchom najpierw instalacje (patrz README-KONFIGURACJA.md)." -ForegroundColor Yellow
    exit 1
}

# Dodaj Node.js do PATH tej sesji
$env:Path = "$nodeDir;" + $env:Path

# Dane n8n (baza, dane logowania, workflowy) trzymamy poza OneDrive
$env:N8N_USER_FOLDER = $runtime

# Ustawienia lokalne
$env:N8N_PORT = "5678"
$env:N8N_SECURE_COOKIE = "false"
# Wylacza wymuszanie klucza szyfrowania w prostym, lokalnym uzyciu
$env:N8N_RUNNERS_ENABLED = "true"

Write-Host "Uruchamiam n8n na http://localhost:5678 ..." -ForegroundColor Green
Write-Host "Aby zatrzymac serwer, nacisnij Ctrl+C w tym oknie." -ForegroundColor DarkGray
Write-Host ""

# Uruchom n8n
& "$nodeDir\node.exe" "$nodeDir\node_modules\n8n\bin\n8n"
