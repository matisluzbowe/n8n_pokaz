# ============================================================
#  Uruchamianie lokalnego serwera n8n
# ============================================================

$ErrorActionPreference = "Stop"

# Folder na dane n8n trzymamy w AppData poza OneDrive
$runtime = Join-Path $env:LOCALAPPDATA "n8n-runtime"
if (-not (Test-Path $runtime)) {
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
}

$portableNode = Join-Path $runtime "node\node.exe"
$portableN8n  = Join-Path $runtime "node\node_modules\n8n\bin\n8n"

$hasPortable = (Test-Path $portableNode) -and (Test-Path $portableN8n)
$hasSystemNode = [bool](Get-Command node -ErrorAction SilentlyContinue)

if (-not $hasPortable -and -not $hasSystemNode) {
    Write-Host "[BLAD] Nie znaleziono Node.js na tym komputerze!" -ForegroundColor Red
    Write-Host "Zainstaluj Node.js ze strony: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Nacisnij Enter, aby zamknac..."
    exit 1
}

# Sprawdz, czy port 5678 nie jest juz zajety
$portInUse = Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[INFO] Serwer n8n prawdopodobnie juz dziala na porcie 5678!" -ForegroundColor Cyan
    Write-Host ">> Otworz w przegladarce: http://localhost:5678" -ForegroundColor Green
    Write-Host ""
    Write-Host "Jesli chcesz zrestartowac, zamknij proces i uruchom skrypt ponownie." -ForegroundColor Gray
    Read-Host "Nacisnij Enter, aby zamknac..."
    exit 0
}

# Ustawienia srodowiska n8n
$env:N8N_USER_FOLDER = $runtime
$env:N8N_PORT = "5678"
$env:N8N_SECURE_COOKIE = "false"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Asystent n8n - Uruchamianie serwera" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host ">> Adres edytora i czatu: http://localhost:5678" -ForegroundColor Green
Write-Host ">> Folder danych n8n: $runtime" -ForegroundColor Gray
Write-Host ">> Aby zatrzymac serwer: nacisnij Ctrl + C w tym oknie" -ForegroundColor Yellow
Write-Host ""

try {
    if ($hasPortable) {
        $env:Path = (Split-Path $portableNode) + ";" + $env:Path
        & $portableNode $portableN8n start
    } else {
        & npx -y n8n start
    }
} catch {
    Write-Host ""
    Write-Host "[BLAD] Wystapil blad podczas uruchamiania n8n:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Nacisnij Enter, aby zamknac to okno..."
}
