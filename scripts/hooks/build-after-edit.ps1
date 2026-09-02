# PostToolUse: após editar HTML/JS/CSS/imagens/fontes, renova o service worker,
# recompila o Tailwind (quando CSS) e roda o gate CWV + classificador de impacto.
# DEBOUNCE POR LOTE: acumula os arquivos alterados e roda UMA ÚNICA VEZ quando o
# cooldown expira (evita rebuild repetido em edição em massa).
$ErrorActionPreference = 'SilentlyContinue'

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

$editTools = @('create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'edit_notebook_file')
if ($editTools -notcontains $data.tool_name) { exit 0 }

$filePaths = @()
if ($data.tool_input.filePath) { $filePaths += [string]$data.tool_input.filePath }
if ($data.tool_input.replacements) {
    foreach ($r in $data.tool_input.replacements) {
        if ($r.filePath) { $filePaths += [string]$r.filePath }
    }
}
if ($filePaths.Count -eq 0) { exit 0 }

$root = (Get-Location).Path

# Extensões web (afetam HTML/CSS/JS e recursos que impactam LCP/CLS/INP)
$webExts = @('.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2')
$webFiles = @()
foreach ($fp in $filePaths) {
    $ext = [System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant()
    if ($ext -in $webExts) { $webFiles += [string]$fp }
}
if ($webFiles.Count -eq 0) { exit 0 }

# ---- DEBOUNCE / COALESCÊNCIA (uma única execução por lote) ----
$COOLDOWN_SECONDS = 5
$markerPath = Join-Path $root 'relatorios\.cwv-batch.json'
$nowEpoch = [int64][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# Carrega o estado pendente acumulado
$pendingFiles = @()
$lastBuild = [int64]0
if (Test-Path $markerPath) {
    try {
        $st = Get-Content $markerPath -Raw | ConvertFrom-Json
        $lastBuild = [int64]$st.lastBuild
        $pendingFiles = @($st.files)
    } catch {
        $lastBuild = 0
        $pendingFiles = @()
    }
}

# Acumula (dedupe) os arquivos do lote
$all = @($pendingFiles) + @($webFiles)
$all = @($all | Select-Object -Unique)

# Se ainda está dentro do cooldown, apenas acumula e sai (build roda depois)
if (($lastBuild -ne 0) -and (($nowEpoch - $lastBuild) -lt $COOLDOWN_SECONDS)) {
    @{ lastBuild = $lastBuild; files = @($all) } | ConvertTo-Json -Compress | Set-Content $markerPath -Encoding UTF8
    exit 0
}

# ---- EXECUTA O BUILD UMA VEZ, SOBRE O LOTE COMPLETO ----
$isCss = @($all | Where-Object { [System.IO.Path]::GetExtension([string]$_).ToLowerInvariant() -eq '.css' }).Count -gt 0

if ($isCss) {
    $twCli = Join-Path $root 'node_modules\tailwindcss\lib\cli.js'
    if (Test-Path $twCli) {
        Push-Location $root
        node $twCli -i ./src/input.css -o ./public/output.css --minify 2>&1 | Out-Null
        Pop-Location
    }
}

$sw = Join-Path $root 'gerar-sw.js'
if (Test-Path $sw) {
    Push-Location $root
    node $sw 2>&1 | Out-Null
    Pop-Location
}

$payload = @{ files = @($all) } | ConvertTo-Json -Compress

$gate = Join-Path $root 'scripts\cwv-gate.js'
if (Test-Path $gate) {
    Push-Location $root
    $payload | node $gate 2>&1 | Out-Null
    Pop-Location
}

$classificador = Join-Path $root 'scripts\classificar-impacto.js'
if (Test-Path $classificador) {
    Push-Location $root
    $payload | node $classificador 2>&1 | Out-Null
    Pop-Location
}

# Reseta o marcador (lote processado) — timestamp do FIM do build (cooldown medido a partir daqui)
$endEpoch = [int64][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
@{ lastBuild = $endEpoch; files = @() } | ConvertTo-Json -Compress | Set-Content $markerPath -Encoding UTF8

exit 0
