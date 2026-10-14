$ErrorActionPreference = 'Stop'
$thumb = $env:NURSING_SIGNING_THUMBPRINT
if ($thumb -notmatch '^[A-Fa-f0-9]{40}$') { throw 'Thumbprint do certificado não configurado.' }
$cert = Get-ChildItem Cert:\CurrentUser\My,Cert:\LocalMachine\My | Where-Object Thumbprint -eq $thumb | Select-Object -First 1
if (-not $cert -or -not $cert.HasPrivateKey) { throw 'Certificado e chave privada indisponíveis no Windows.' }
if ($cert.NotBefore -gt (Get-Date) -or $cert.NotAfter -lt (Get-Date)) { throw 'Certificado fora do período de validade.' }
if (-not ($cert.EnhancedKeyUsageList | Where-Object { $_.ObjectId -eq '1.3.6.1.5.5.7.3.3' })) { throw 'O certificado não permite Code Signing.' }
$chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
try {
  $chain.ChainPolicy.RevocationMode = 'Online'
  $chain.ChainPolicy.VerificationFlags = 'NoFlag'
  if (-not $chain.Build($cert)) { throw 'Cadeia do certificado não reconhecida ou revogada. Não use certificado autoassinado.' }
} finally { $chain.Dispose() }
Write-Host 'Certificado Code Signing validado. A chave privada não será exportada.'
