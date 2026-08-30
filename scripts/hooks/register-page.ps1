# PostToolUse: detecta HTML novo na raiz ainda não registrado em relatorio_paginas.txt (não bloqueia, reporta).
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

if ($data.tool_name -ne 'create_file') { exit 0 }

$filePaths = @()
if ($data.tool_input.filePath) { $filePaths += [string]$data.tool_input.filePath }
if ($filePaths.Count -eq 0) { exit 0 }

$root = (Get-Location).Path
$rootNorm = ($root -replace '\\', '/').TrimEnd('/')

$relatorio = Join-Path $root 'relatorio_paginas.txt'
$relContent = ''
if (Test-Path -LiteralPath $relatorio) {
    try { $relContent = [System.IO.File]::ReadAllText($relatorio, [System.Text.Encoding]::UTF8) } catch {}
}

$proibidos = @('footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html')

$findings = @()
foreach ($fp in $filePaths) {
    if ([System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant() -ne '.html') { continue }
    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    $norm = ($p -replace '\\', '/').TrimEnd('/')
    if ($norm.StartsWith($rootNorm, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $norm.Substring($rootNorm.Length).TrimStart('/')
    } else { continue }

    $parts = $rel -split '/'
    if ($parts.Count -ne 1) { continue }              # só arquivo direto na raiz (não em subpastas/idiomas)
    $name = $parts[0]
    if ($name -like '*.min.html') { continue }
    if ($proibidos -contains $name) { continue }

    # Registrado = existe linha iniciando com "<arquivo> ="
    if ($relContent -notmatch "(?m)^\s*$([regex]::Escape($name))\s*=") {
        $findings += "${name}: página nova ainda NÃO registrada em relatorio_paginas.txt"
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'register-page: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
