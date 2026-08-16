# PreToolUse: bloqueia comandos git de commit/push (responsabilidade do usuário).
# Regra: AI_RULES.md — "Nunca executar git commit ou git push".
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

if ($data.tool_name -ne 'run_in_terminal') { exit 0 }

$cmd = [string]$data.tool_input.command
if ($cmd -match '\bgit\s+(commit|push)\b') {
    $out = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'deny'
            permissionDecisionReason = 'Bloqueado: git commit/push é responsabilidade do usuário (AI_RULES.md).'
        }
    } | ConvertTo-Json -Compress
    Write-Output $out
    exit 0
}

exit 0
