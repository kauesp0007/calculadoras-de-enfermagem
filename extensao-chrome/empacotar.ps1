param(
    [string]$Destino = ""
)

$ErrorActionPreference = "Stop"
$extensionRoot = $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $extensionRoot "manifest.json") -Raw | ConvertFrom-Json

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Para validar e empacotar, instale Node.js e execute novamente. Carregar a extensao no Chrome nao exige Node.js."
}

& node (Join-Path $extensionRoot "tests/run.cjs")
if ($LASTEXITCODE -ne 0) {
    throw "Os testes falharam. O ZIP nao foi criado."
}

if ([string]::IsNullOrWhiteSpace($Destino)) {
    $Destino = Join-Path $extensionRoot ("calculadora-gasometria-arterial-" + $manifest.version + ".zip")
}
if (Test-Path -LiteralPath $Destino) {
    throw "Ja existe um arquivo nesse destino. Escolha outro nome com -Destino."
}

$extensionPackageEntries = @(
    "manifest.json",
    "service-worker.js",
    "content-script.js",
    "calculator.html",
    "calculator.css",
    "calculator.js",
    "gasometria-core.js",
    "icons",
    "fonts"
) | ForEach-Object { Join-Path $extensionRoot $_ }

Compress-Archive -LiteralPath $extensionPackageEntries -DestinationPath $Destino -CompressionLevel Optimal
Write-Host ("ZIP criado: " + $Destino)
Write-Host "Confira no Chrome antes de enviar a Chrome Web Store."
