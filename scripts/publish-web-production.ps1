param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")

Write-Host "Building web with VITE_API_BASE_URL=$ApiBaseUrl"
Push-Location (Join-Path $PSScriptRoot "..\frontend\web")
try {
  $env:VITE_API_BASE_URL = $ApiBaseUrl
  yarn install --frozen-lockfile
  yarn build
  Write-Host "Output: $(Resolve-Path .\dist)"
} finally {
  Pop-Location
}
