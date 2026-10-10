# RusWallet — veritabanı migration (staging / production deploy öncesi)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Infrastructure = Join-Path $Root "backend\RusWallet.Infrastructure\RusWallet.Infrastructure.csproj"
$Api = Join-Path $Root "backend\RusWallet.API\RusWallet.API.csproj"

Write-Host "Building API..."
dotnet build $Api -c Release

Write-Host "Applying EF migrations..."
dotnet ef database update `
  --project $Infrastructure `
  --startup-project $Api `
  --configuration Release

Write-Host "Done. Smoke: GET /health on API after start."
