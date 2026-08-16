# Auditoria básica de acessibilidade em uma página HTML.
# Uso: -Path <arquivo.html>
param([Parameter(Mandatory = $true)][string]$Path)
$ErrorActionPreference = 'SilentlyContinue'

if (-not (Test-Path $Path)) { Write-Output "Arquivo não encontrado: $Path"; exit 1 }

$html = Get-Content -Raw -Encoding UTF8 $Path
# Remove blocos <script> e <style> para não auditar código JS/CSS como HTML
$html = [regex]::Replace($html, '(?is)<script\b[^>]*>.*?</script>', '')
$html = [regex]::Replace($html, '(?is)<style\b[^>]*>.*?</style>', '')
$issues = @()

if ($html -notmatch '<html[^>]*\slang="') { $issues += "[ALTO] Falta atributo lang no <html>" }

if ($html -notmatch 'class="[^"]*skip-link') { $issues += "[MÉDIO] Skip-link não encontrado (link 'pular para o conteúdo')" }

if ($html -match '<h1[\s>]') {
    $h1count = ([regex]::Matches($html, '<h1[\s>]')).Count
    if ($h1count -gt 1) { $issues += "[ALTO] Mais de um <h1> ($h1count encontrados)" }
} else {
    $issues += "[ALTO] Nenhum <h1> encontrado"
}

$imgs = [regex]::Matches($html, '<img\b[^>]*>')
$semAlt = 0
foreach ($m in $imgs) {
    if ($m.Value -notmatch '\salt=') { $semAlt++ }
}
if ($semAlt -gt 0) { $issues += "[ALTO] $semAlt imagem(ns) sem atributo alt" }

$inputs = [regex]::Matches($html, '<input\b[^>]*>')
foreach ($m in $inputs) {
    $tag = $m.Value
    if ($tag -match '\stype="(hidden|submit|button|reset)"') { continue }
    if ($tag -notmatch '\s(id=|aria-label=|aria-labelledby=)') {
        $short = $tag.Substring(0, [Math]::Min(80, $tag.Length))
        $issues += "[MÉDIO] Input sem label associado: $short"
    }
}

if ($issues.Count -eq 0) {
    Write-Output "Nenhum problema crítico de acessibilidade encontrado em $Path."
} else {
    Write-Output "Relatório de acessibilidade — $Path"
    $issues | ForEach-Object { Write-Output " - $_" }
}
