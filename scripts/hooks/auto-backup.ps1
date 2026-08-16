# PreToolUse: gera backup automático antes de editar arquivos.
# Todos os backups ficam centralizados em backups-temporarios/ (pasta única).
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

$editTools = @('create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'edit_notebook_file')
if ($editTools -notcontains $data.tool_name) { exit 0 }

# Coleta os caminhos de arquivo (direto ou via replacements[])
$filePaths = @()
if ($data.tool_input.filePath) { $filePaths += [string]$data.tool_input.filePath }
if ($data.tool_input.replacements) {
    foreach ($r in $data.tool_input.replacements) {
        if ($r.filePath) { $filePaths += [string]$r.filePath }
    }
}
if ($filePaths.Count -eq 0) { exit 0 }

$root = (Get-Location).Path
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'

foreach ($fp in $filePaths) {
    # Normaliza caminho (aceita file:/// URI ou caminho absoluto)
    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { continue }

    # Caminho relativo à raiz do repo
    $rel = $p
    if ($rel.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $rel.Substring($root.Length).TrimStart('\', '/')
    }
    $relDir = Split-Path $rel
    $fileName = Split-Path $rel -Leaf

    $backupDir = Join-Path 'backups-temporarios' $relDir
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $backupFile = Join-Path $backupDir ("{0}.{1}.bak" -f $fileName, $ts)
    Copy-Item -LiteralPath $p -Destination $backupFile -Force
}

# Nunca bloqueia a edição
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PreToolUse'
        permissionDecision = 'allow'
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
