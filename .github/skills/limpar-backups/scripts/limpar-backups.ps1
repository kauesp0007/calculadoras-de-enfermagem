# Limpa o conteúdo de backups-temporarios/ (pasta única de backups do projeto).
# Uso:
#   -WhatIf  : mostra resumo sem excluir
#   -Force   : exclui sem pedir confirmação
param([switch]$Force, [switch]$WhatIf)
$ErrorActionPreference = 'Stop'

$dir = 'backups-temporarios'
if (-not (Test-Path $dir)) { Write-Output "Pasta '$dir' não existe. Nada para limpar."; exit 0 }

$files = Get-ChildItem -Path $dir -Recurse -File -ErrorAction SilentlyContinue
if (-not $files) { Write-Output "Pasta '$dir' está vazia."; exit 0 }

$total = ($files | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($total / 1MB, 2)
Write-Output "Resumo: $($files.Count) arquivo(s) — $sizeMB MB em '$dir'."

if ($WhatIf) { exit 0 }

if (-not $Force) {
    $resp = Read-Host "Excluir TODOS os arquivos de '$dir'? (s/N)"
    if ($resp -notmatch '^(s|sim|y|yes)$') { Write-Output "Cancelado."; exit 0 }
}

Remove-Item -Path (Join-Path $dir '*') -Recurse -Force
Write-Output "Backups excluídos. Espaço liberado: ~$sizeMB MB."
