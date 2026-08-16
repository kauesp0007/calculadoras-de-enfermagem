# PostToolUse: após editar HTML/JS/CSS, renova o service worker
# (e recompila o Tailwind apenas quando o arquivo alterado é CSS).
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
$isWeb = $false
$isCss = $false
foreach ($fp in $filePaths) {
    $ext = [System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant()
    if ($ext -in @('.html', '.js', '.css')) { $isWeb = $true }
    if ($ext -eq '.css') { $isCss = $true }
}
if (-not $isWeb) { exit 0 }

$sw = Join-Path $root 'gerar-sw.js'
if (-not (Test-Path $sw)) { exit 0 }

if ($isCss) {
    $twCli = Join-Path $root 'node_modules\tailwindcss\lib\cli.js'
    if (Test-Path $twCli) {
        Push-Location $root
        node $twCli -i ./src/input.css -o ./public/output.css --minify 2>&1 | Out-Null
        Pop-Location
    }
}

Push-Location $root
node $sw 2>&1 | Out-Null
Pop-Location
exit 0
