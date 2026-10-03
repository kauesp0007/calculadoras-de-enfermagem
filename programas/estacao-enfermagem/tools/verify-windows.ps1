param([switch]$RequireSigned, [string[]]$Files)
$ErrorActionPreference = 'Stop'
if (-not $Files) {
  $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
  $Files = @((Join-Path (Get-Location) "dist/Estacao-Enfermagem-Setup-$version-x64.exe"), (Join-Path (Get-Location) 'dist/win-unpacked/Estação de Enfermagem.exe'))
}
if (-not $Files.Count) { throw 'Não há executáveis para verificar.' }
$results = foreach ($file in $Files) {
  if (-not (Test-Path -LiteralPath $file)) { throw "Executável ausente: $file" }
  $sig = Get-AuthenticodeSignature -LiteralPath $file
  $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
  if ($RequireSigned) {
    if ($sig.Status -ne 'Valid') { throw "Assinatura inválida ou ausente: $file ($($sig.Status))" }
    if (-not $sig.TimeStamperCertificate) { throw "Carimbo de tempo ausente: $file" }
    if (-not $env:NURSING_SIGNING_THUMBPRINT -or $sig.SignerCertificate.Thumbprint -ne $env:NURSING_SIGNING_THUMBPRINT) { throw "Certificado do assinante diferente do esperado: $file" }
  } elseif ($sig.Status -ne 'NotSigned') { throw "Build de homologação apresenta assinatura inesperada: $file ($($sig.Status))" }
  [pscustomobject]@{File=[IO.Path]::GetFileName($file);SHA256=$hash;Authenticode=[string]$sig.Status;Signer=$sig.SignerCertificate.Subject;Timestamp=($null -ne $sig.TimeStamperCertificate);Purpose=$(if ($RequireSigned) {'Assinada — cadeia validada no Windows'} else {'Homologação — SEM ASSINATURA DIGITAL'})}
}
$results | ConvertTo-Json -Depth 3 | Set-Content dist/ASSINATURA-WINDOWS.json -Encoding utf8
$results | Format-Table File,Authenticode,Timestamp,Purpose -AutoSize
if (-not $RequireSigned) { Write-Warning 'Certificado ainda não emitido. Esta build não resolve o alerta de reputação do SmartScreen.' }
