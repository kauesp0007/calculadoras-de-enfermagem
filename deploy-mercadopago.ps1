# ============================================================
# Deploy do Mercado Pago (Supabase Edge Functions)
# ============================================================
$ErrorActionPreference = "Stop"
$PROJECT_REF = "asjkftjfbkuuhilnqonx"

function Step($n, $msg) {
    Write-Host ""
    Write-Host "[$n/5] $msg" -ForegroundColor Cyan
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY DO MERCADO PAGO" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Login
Step 1 "Login no Supabase (vai abrir o navegador - clique em Authorize)"
supabase login

# 2. Link
Step 2 "Conectando ao projeto $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

# 3. Secrets
Step 3 "Configurando as chaves secretas"

# Firebase service account (ler direto do arquivo em Downloads)
$jsonFile = Get-ChildItem "$env:USERPROFILE\Downloads\calculadoras-enfermagem-firebase-adminsdk-*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $jsonFile) {
    Write-Host "Nao encontrei o arquivo do Firebase em Downloads." -ForegroundColor Yellow
    $manual = Read-Host "Cole o caminho completo do arquivo JSON do Firebase"
    $jsonFile = Get-Item $manual
}
Write-Host "  Usando: $($jsonFile.FullName)" -ForegroundColor DarkGray
$sa = (Get-Content -Raw $jsonFile.FullName | ConvertFrom-Json | ConvertTo-Json -Compress)
supabase secrets set "FIREBASE_SERVICE_ACCOUNT=$sa"
Write-Host "  Firebase OK." -ForegroundColor Green

# MP token (digite direto no terminal - NAO no chat)
$mp = Read-Host "Cole o Access Token do Mercado Pago"
supabase secrets set "MERCADO_PAGO_ACCESS_TOKEN=$mp"
Write-Host "  Mercado Pago OK." -ForegroundColor Green

# 4. Deploy
Step 4 "Publicando as funcoes"
supabase functions deploy mercadopago-create-preference
supabase functions deploy mercadopago-webhook --no-verify-jwt

# 5. Fim
Step 5 "Concluido!"
Write-Host ""
Write-Host "Falta UM ultimo passo:" -ForegroundColor Yellow
Write-Host "1. Abra https://supabase.com/dashboard"
Write-Host "2. Abra seu projeto -> SQL Editor -> New query"
Write-Host "3. Cole o conteudo do arquivo supabase/setup-payments.sql e clique Run"
Write-Host ""
Write-Host "Pronto! O pagamento ja esta funcionando." -ForegroundColor Green
