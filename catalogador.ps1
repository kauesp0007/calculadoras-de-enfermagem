<# Catalogador Inteligente de PDFs - Menu Interativo #>
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Carrega .env
$envFile = Join-Path $scriptDir ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^\s*#') {
            $parts = $line -split '=', 2
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                if (-not [Environment]::GetEnvironmentVariable($key, "Process")) {
                    [Environment]::SetEnvironmentVariable($key, $value, "Process")
                }
            }
        }
    }
}

$pythonPath = "C:/Users/kaues/AppData/Local/Python/pythoncore-3.14-64/python.exe"

function Wait-Key { Read-Host "`nPressione Enter para continuar" | Out-Null }

Clear-Host
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CATALOGADOR INTELIGENTE DE PDFs" -ForegroundColor Cyan
Write-Host "  Calculadoras de Enfermagem" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Status
if ($env:DEEPSEEK_API_KEY) {
    $masked = $env:DEEPSEEK_API_KEY.Substring(0, [Math]::Min(10, $env:DEEPSEEK_API_KEY.Length)) + "..."
    Write-Host "  API Key: $masked" -ForegroundColor Green
} else {
    Write-Host "  API Key: NAO CONFIGURADA" -ForegroundColor Red
}
$pdfCount = (Get-ChildItem -Path "docs" -Filter "*.pdf" -ErrorAction SilentlyContinue).Count
Write-Host "  PDFs na pasta docs/: $pdfCount" -ForegroundColor White
Write-Host ""

Write-Host "  OPERACOES:" -ForegroundColor Yellow
Write-Host "  [1] Processar todos os PDFs"
Write-Host "  [2] Monitorar pasta docs/"
Write-Host "  [3] Ver estatisticas"
Write-Host "  [4] Forcar reprocessamento total"
Write-Host "  [C] Excluir PDFs duplicados"
Write-Host ""
Write-Host "  UTILITARIOS:" -ForegroundColor Yellow
Write-Host "  [K] Configurar API Key DeepSeek"
Write-Host "  [L] Abrir pasta de logs"
Write-Host "  [D] Abrir pasta docs/"
Write-Host "  [Q] Sair"
Write-Host ""

$choice = Read-Host "Escolha uma opcao"

switch ($choice.ToUpper()) {
    "1" {
        if (-not $env:DEEPSEEK_API_KEY) {
            $c = Read-Host "API Key nao definida. Continuar com fallback? (s/N)"
            if ($c -notmatch "^[sSyY]") { break }
        }
        & $pythonPath -m automacoes.catalogador.main --once
        Wait-Key
    }
    "2" {
        if (-not $env:DEEPSEEK_API_KEY) {
            $c = Read-Host "API Key nao definida. Continuar? (s/N)"
            if ($c -notmatch "^[sSyY]") { break }
        }
        Write-Host "Monitorando docs/... Ctrl+C para parar." -ForegroundColor Cyan
        & $pythonPath -m automacoes.catalogador.main --watch
    }
    "3" {
        & $pythonPath -m automacoes.catalogador.main --stats
        Wait-Key
    }
    "4" {
        Write-Host "ATENCAO: Limpa cache e reprocessa TODOS os PDFs." -ForegroundColor Yellow
        $c = Read-Host "Tem certeza? (s/N)"
        if ($c -match "^[sSyY]") {
            if (-not $env:DEEPSEEK_API_KEY) {
                $c2 = Read-Host "API Key nao definida. Continuar? (s/N)"
                if ($c2 -notmatch "^[sSyY]") { break }
            }
            & $pythonPath -m automacoes.catalogador.main --reprocess
        }
        Wait-Key
    }
    "C" {
        Write-Host "Procurando PDFs duplicados (mesmo conteudo, nomes diferentes)..." -ForegroundColor Cyan
        & $pythonPath -m automacoes.catalogador.main --cleanup
        Wait-Key
    }
    "K" {
        $key = Read-Host "Cole sua DEEPSEEK_API_KEY (sk-...)"
        if ($key -match "^sk-") {
            $env:DEEPSEEK_API_KEY = $key
            $envFile = Join-Path $scriptDir ".env"
            $lines = if (Test-Path $envFile) { Get-Content $envFile } else { @() }
            $found = $false
            $newLines = $lines | ForEach-Object {
                if ($_ -match '^DEEPSEEK_API_KEY=') {
                    $found = $true
                    "DEEPSEEK_API_KEY=$key"
                } else { $_ }
            }
            if (-not $found) { $newLines += "DEEPSEEK_API_KEY=$key" }
            $newLines | Set-Content $envFile -Encoding UTF8
            Write-Host "API Key salva no .env!" -ForegroundColor Green
        } else {
            Write-Host "Chave invalida. Use sk-..." -ForegroundColor Red
        }
        Wait-Key
    }
    "L" {
        $logsPath = "$scriptDir\logs"
        if (Test-Path $logsPath) { Invoke-Item $logsPath }
        else { Write-Host "Pasta logs/ ainda nao existe." }
    }
    "D" { Invoke-Item "$scriptDir\docs" }
    "Q" { Write-Host "Ate logo!" -ForegroundColor Cyan }
    default { Write-Host "Opcao invalida." -ForegroundColor Red; Wait-Key }
}
