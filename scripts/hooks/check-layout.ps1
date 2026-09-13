# PostToolUse: verifica regras canônicas de largura, hero, espaçamento e acabamento visual.
# Fonte canônica: CATALOGO_DE_IDENTIDADE_VISUAL/PADRAO_CANONICO_PAGINAS_HTML.md
# Regras 60/61: NUNCA container/max-w-*/mx-auto; alta densidade; hero institucional compacto.
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

    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { continue }

    try { $content = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) } catch { continue }

    # Remove scripts (evita falsos positivos); preserva styles para auditar o layout.
    $scan = $content -replace '(?is)<script\b.*?</script>', ''
    $name = Split-Path $p -Leaf

    if ($scan -match 'class\s*=\s*["''][^"'']*\bcontainer\b') {
        $findings += "${name}: classe 'container' (proibida no container principal)"
    }
    if ($scan -match '\bmax-w-(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|screen)\b') {
        $findings += "${name}: classe 'max-w-*' (proibida no main/hero)"
    }
    if ($scan -match '\bmx-auto\b') {
        $findings += "${name}: classe 'mx-auto' (proibida no main/hero)"
    }
    if ($scan -match '\.hero\s*\{[^}]*max-width') {
        $findings += "${name}: .hero com 'max-width' (hero deve ocupar 100% da largura)"
    }
    if ($scan -match '\.hero\s*\{[^}]*margin[^;}]*auto') {
        $findings += "${name}: .hero com 'margin: auto' (hero deve ficar alinhado à esquerda)"
    }
    if ($scan -match '\b(?:mx|px)-(?:16|20|24|28|32|40|48|56|64|72|80|96)\b') {
        $findings += "${name}: grandes margens laterais (mx/px >= 4rem) — regra 60"
    }
    if ($scan -match '\b(?:p|py|pt|pb|pl|pr|m|my|mt|mb|ml|mr|gap)-(?:16|20|24|28|32|40|48|56|64|72|80|96)\b') {
        $findings += "${name}: espaçamento grande (p/m/gap >= 4rem) — regra 61: alta densidade"
    }

    # Verificações objetivas do padrão visual canônico quando a página possui hero.
    if ($scan -match '(?is)(?:class=["''][^"'']*\bhero\b[^"'']*["'']|\.hero\s*\{)') {
        if ($scan -notmatch '(?is)#1A3E74|#1a3e74') {
            $findings += "${name}: hero detectado sem referência evidente ao navy institucional #1A3E74"
        }
        if ($scan -notmatch '(?is)linear-gradient\s*\([^)]*#1A3E74|linear-gradient\s*\([^)]*#1a3e74') {
            $findings += "${name}: hero detectado sem gradiente institucional evidente"
        }
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'check-layout: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
