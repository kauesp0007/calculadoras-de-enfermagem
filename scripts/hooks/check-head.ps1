# PostToolUse: verifica presença dos elementos essenciais do <head> em HTML editado (não bloqueia).
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

    $head = $content
    $m = [regex]::Match($content, '(?is)<head\b.*?</head>')
    if ($m.Success) { $head = $m.Value }

    $faltando = @()
    if ($head -notmatch '<meta\s+[^>]*charset') { $faltando += 'charset' }
    if ($head -notmatch 'name\s*=\s*["'']viewport') { $faltando += 'viewport' }
    if ($head -notmatch '<title\b') { $faltando += 'title' }
    if ($head -notmatch 'name\s*=\s*["'']description') { $faltando += 'meta description' }
    if ($head -notmatch 'rel\s*=\s*["'']canonical') { $faltando += 'canonical' }
    if ($head -notmatch 'og:title') { $faltando += 'og:title' }
    if ($head -notmatch 'twitter:card') { $faltando += 'twitter:card' }
    if ($head -notmatch 'theme-color') { $faltando += 'theme-color' }
    if ($head -notmatch 'rel\s*=\s*["''][^"'']*icon') { $faltando += 'favicon' }

    if ($faltando.Count -gt 0) {
        $findings += "${name}: falta no head -> " + ($faltando -join ', ')
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'check-head: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
