# PostToolUse: valida sintaxe JSON dos arquivos .json editados (não bloqueia, apenas reporta).
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

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

$findings = @()

foreach ($fp in $filePaths) {
    if ([System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant() -ne '.json') { continue }
    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { continue }

    try {
        $text = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
        $null = $text | ConvertFrom-Json
    } catch {
        $name = Split-Path $p -Leaf
        $findings += "${name}: JSON invalido ($($_.Exception.Message))"
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'check-json: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
