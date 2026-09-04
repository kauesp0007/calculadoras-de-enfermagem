# PreToolUse: protege arquivos/pastas proibidos (AI_RULES.md / copilot-instructions.md).
# - deny absoluto: .git/, node_modules/ e segredos.
# - ask (exceção controlada — exige autorização explícita): regras canônicas, MCP, deploy/SW, login e demais protegidos.
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

$root = (Get-Location).Path
$rootNorm = ($root -replace '\\', '/').TrimEnd('/')

$secretSuffixes = @('.env', '.pem', '.key', '.p12', 'credentials.json', 'serviceAccount.json')

$protectedFiles = @('footer.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html', 'mapa-do-site.html', 'package.json', 'package-lock.json', 'AI_RULES.md', 'HTML_RULES.md', 'HTML_PAGE_TEMPLATE_RULES.md', 'copilot-instructions.md', 'mcp.json', '.mcp.json', 'deploy.yml', 'gerar-sw.js', 'sw-template.js', 'firestore.rules')
$protectedDirs = @('downloads', 'biblioteca', 'blog', 'blog-templates', 'CATALOGO_DOS_AGENTES_E_HOOKS', 'CATALOGO_DA_ARQUITETURA_ESTRUTURAL', 'CATALOGO_DE_ESTRUTURA_FISICA', 'CATALOGO_DE_IDENTIDADE_VISUAL', 'CATALOGO_SEO_METAS_HEAD', 'governance', 'knowledge', 'scripts/hooks', '.github/hooks', 'js/auth', 'js/firebase', 'SISTEMA_DE_LOGIN_DO_SITE')

$decision = 'allow'
$reason = ''

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
    } else {
        $rel = $norm
    }

    $segments = $rel -split '/'
    $leaf = $segments[-1]

    if ($segments -contains '.git') {
        $decision = 'deny'
        $reason = 'Bloqueado: edição dentro de .git/ é proibida (AI_RULES.md).'
        break
    }
    if ($segments -contains 'node_modules') {
        $decision = 'deny'
        $reason = 'Bloqueado: edição dentro de node_modules/ é proibida (AI_RULES.md).'
        break
    }
    $hitSecret = $false
    foreach ($suf in $secretSuffixes) {
        if ($leaf.EndsWith($suf, [System.StringComparison]::OrdinalIgnoreCase)) {
            $decision = 'deny'
            $reason = "Bloqueado: '$leaf' pode conter segredos/credenciais."
            $hitSecret = $true
            break
        }
    }
    if ($hitSecret) { break }

    if ($protectedFiles -contains $leaf) {
        $decision = 'ask'
        $reason = "Arquivo protegido '$leaf' exige autorização explícita (copilot-instructions.md)."
        break
    }
    $hitDir = $false
    foreach ($d in $protectedDirs) {
        if ($rel -eq $d -or $rel.StartsWith("$d/", [System.StringComparison]::OrdinalIgnoreCase)) {
            $decision = 'ask'
            $reason = "Pasta protegida '$d/' exige autorização explícita (copilot-instructions.md)."
            $hitDir = $true
            break
        }
    }
    if ($hitDir) { break }
}

$out = @{
    hookSpecificOutput = @{
        hookEventName = 'PreToolUse'
        permissionDecision = $decision
    }
}
if ($reason) { $out.hookSpecificOutput.permissionDecisionReason = $reason }

Write-Output ($out | ConvertTo-Json -Compress)
exit 0
