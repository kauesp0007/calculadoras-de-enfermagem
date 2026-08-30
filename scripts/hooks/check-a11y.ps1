# PostToolUse: checagens básicas de acessibilidade em HTML editado (não bloqueia, reporta).
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
    if ([System.IO.Path]::GetExtension([string]$fp).ToLowerInvariant() -ne '.html') { continue }
    $name = Split-Path ([string]$fp) -Leaf
    if ($name -like '*.min.html') { continue }

    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { continue }
    try { $content = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) } catch { continue }

    # Remove blocos <script> e <style> para evitar falso positivo (template de impressão)
    $scan = $content -replace '(?is)<script\b.*?</script>', '' -replace '(?is)<style\b.*?</style>', ''

    if ($scan -notmatch '<html\b[^>]*\blang\s*=') {
        $findings += "${name}: atributo lang ausente no <html>"
    }
    if ($scan -notmatch 'skip-link') {
        $findings += "${name}: skip-link ausente"
    }

    $h1Count = [regex]::Matches($scan, '(?is)<h1\b').Count
    if ($h1Count -ne 1) {
        $findings += "${name}: $h1Count <h1> encontrado(s) (esperado 1)"
    }

    $imgs = [regex]::Matches($scan, '(?is)<img\b[^>]*>')
    $semAlt = 0
    foreach ($img in $imgs) {
        $tag = $img.Value
        if ($tag -match 'id="lightboxImg"' -or $tag -match 'src=""' -or $tag -match "src=''") { continue }
        if ($tag -notmatch '\balt\s*=') { $semAlt++ }
    }
    if ($semAlt -gt 0) {
        $findings += "${name}: $semAlt imagem(ns) sem atributo alt"
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'check-a11y: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
