# PostToolUse: após editar HTML/JS/CSS/imagens/fontes, renova o service worker,
# recompila o Tailwind (quando CSS) e roda o gate determinístico de CWV/performance.
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
$isWeb = $false
$isCss = $false
$webFiles = @()
foreach ($fp in $filePaths) {
    $ext = [System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant()
    if ($ext -in $webExts) {
        $isWeb = $true
        $webFiles += [string]$fp
    }
    if ($ext -eq '.css') { $isCss = $true }
}
if (-not $isWeb) { exit 0 }

# 1. Build (Tailwind quando CSS; service worker sempre)
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

# 2. Gate CWV/performance (determinístico): auditar -> corrigir -> re-auditar -> evidência.
$gate = Join-Path $root 'scripts\cwv-gate.js'
if (Test-Path $gate) {
    $payload = @{ files = @($webFiles) } | ConvertTo-Json -Compress
    Push-Location $root
    $payload | node $gate 2>&1 | Out-Null
    Pop-Location
}

# 3. Classificador de impacto (determinístico): tipo + seleção mínima de subagentes.
$classificador = Join-Path $root 'scripts\classificar-impacto.js'
if (Test-Path $classificador) {
    $payload2 = @{ files = @($webFiles) } | ConvertTo-Json -Compress
    Push-Location $root
    $payload2 | node $classificador 2>&1 | Out-Null
    Pop-Location
}

exit 0
