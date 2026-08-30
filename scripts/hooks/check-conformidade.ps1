# PostToolUse: verifica se um novo componente (agente/hook/skill/prompt) tem registro de conformidade.
# Componente sem entrada em registro-conformidade.json = NÃO CONFORME (reporta, não bloqueia).
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

$reg = Join-Path $root 'CATALOGO_DOS_AGENTES_E_HOOKS\registro-conformidade.json'
$regContent = ''
if (Test-Path -LiteralPath $reg) {
    try { $regContent = [System.IO.File]::ReadAllText($reg, [System.Text.Encoding]::UTF8) } catch {}
}

$findings = @()

foreach ($fp in $filePaths) {
    $p = [string]$fp
    if ($p -match '^file://') {
        try { $p = ([System.Uri]$p).LocalPath } catch { $p = $p -replace '^file:///', '' }
    }
    $norm = ($p -replace '\\', '/').TrimEnd('/')
    if (-not $norm.StartsWith('/') -and -not ($norm -match '^[A-Za-z]:')) {
        $norm = "$rootNorm/$($norm.TrimStart('/'))"
    }
    if ($norm.StartsWith($rootNorm, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $norm.Substring($rootNorm.Length).TrimStart('/')
    } else { continue }

    # Só interessa componente novo (agente/hook/skill/prompt/mcp)
    $isComponent = $false
    if ($rel -match '^\.github/agents/[^/]+\.agent\.md$') { $isComponent = $true }
    elseif ($rel -match '^\.github/hooks/[^/]+\.json$') { $isComponent = $true }
    elseif ($rel -match '^scripts/hooks/[^/]+\.ps1$') { $isComponent = $true }
    elseif ($rel -match '^\.github/skills/[^/]+/SKILL\.md$') { $isComponent = $true }
    elseif ($rel -match '^\.github/prompts/[^/]+\.prompt\.md$') { $isComponent = $true }
    elseif ($rel -match '^(mcp\.json|\.mcp\.json)$') { $isComponent = $true }
    if (-not $isComponent) { continue }

    $fileName = Split-Path $rel -Leaf
    $registrado = $false
    if ($regContent) {
        if ($regContent -match [regex]::Escape($rel)) { $registrado = $true }
        elseif ($regContent -match [regex]::Escape($fileName)) { $registrado = $true }
    }

    if (-not $registrado) {
        $findings += "${fileName}: componente novo SEM registro de conformidade (NÃO CONFORME — registrar necessidade/justificativa/teste/catálogo em registro-conformidade.json)"
    }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = 'check-conformidade: ' + ($findings -join ' | ')
$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PostToolUse'
        message = $msg
    }
} | ConvertTo-Json -Compress
Write-Output $out
exit 0
