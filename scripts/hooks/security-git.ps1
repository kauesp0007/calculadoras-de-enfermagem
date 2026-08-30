# PreToolUse: bloqueia comandos perigosos (git commit/push, destrutivos) e exige autorização para instalações.
# Regra: AI_RULES.md + segurança (§29) — nenhum comando destrutivo/instalação sem autorização explícita.
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

if ($data.tool_name -ne 'run_in_terminal') { exit 0 }

$cmd = [string]$data.tool_input.command

$decision = $null
$reason = $null

if ($cmd -match '\bgit\s+(commit|push)\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: git commit/push é responsabilidade do usuário (AI_RULES.md).'
}
elseif ($cmd -match '\bgit\s+reset\s+--hard\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: git reset --hard é destrutivo.'
}
elseif ($cmd -match '\brm\s+-[a-z]*r[a-z]*\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: remoção recursiva (rm -r/-rf) é destrutiva.'
}
elseif ($cmd -match '\bRemove-Item\b[^\r\n]*-Recurse\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: Remove-Item -Recurse é destrutivo (apaga árvore).'
}
elseif ($cmd -match '\b(?:del|rd)\s+/s\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: del/rd /s é destrutivo.'
}
elseif ($cmd -match '\b(?:gsutil|gcloud\s+storage)\s+rm\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: remoção em Cloud Storage é destrutiva.'
}
elseif ($cmd -match '\bgcloud\s+projects\s+delete\b') {
    $decision = 'deny'
    $reason = 'Bloqueado: exclusão de projeto GCP é destrutiva.'
}
elseif ($cmd -match '\bnpm\s+(install|i|add|uninstall|ci)\b') {
    $decision = 'ask'
    $reason = 'Instalação de dependência externa (npm) exige autorização explícita.'
}
elseif ($cmd -match '\bpip3?\s+install\b') {
    $decision = 'ask'
    $reason = 'Instalação de dependência externa (pip) exige autorização explícita.'
}

if ($decision) {
    $out = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = $decision
        }
    }
    if ($reason) { $out.hookSpecificOutput.permissionDecisionReason = $reason }
    Write-Output ($out | ConvertTo-Json -Compress)
    exit 0
}

exit 0
