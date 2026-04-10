param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "https://topscorer-iilakens6-trilineums-projects.vercel.app"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
  param(
    [string]$Method,
    [string]$Url,
    [string]$Body = ""
  )

  $args = @("-sS", "-i", "-X", $Method, $Url)
  if ($Method -eq "POST") {
    $args += @("-H", "Content-Type: application/json", "--data-binary", $Body)
  }

  $raw = & curl.exe @args
  $statusLine = ($raw | Select-String -Pattern "^HTTP\/\d\.\d\s+\d+" | Select-Object -First 1).Line
  $statusCode = if ($statusLine) { ($statusLine -split "\s+")[1] } else { "N/A" }
  $isVercelProtection = ($raw -match "Vercel Authentication" -or $raw -match "sso-api")

  [PSCustomObject]@{
    Method            = $Method
    Url               = $Url
    StatusCode        = $statusCode
    VercelProtection  = if ($isVercelProtection) { "YES" } else { "NO" }
  }
}

$base = $BaseUrl.TrimEnd("/")
$api = "$base/api"

$checks = @(
  @{ m = "GET";  u = "$base/" },
  @{ m = "GET";  u = "$base/health" },
  @{ m = "GET";  u = "$api" },
  @{ m = "GET";  u = "$api/auth/me" },
  @{ m = "POST"; u = "$api/auth/login"; body = '{"email":"demo@example.com","password":"demo123456"}' },
  @{ m = "POST"; u = "$api/auth/register"; body = '{"name":"Demo User","email":"demo@example.com","password":"demo123456","role":"student"}' },
  @{ m = "GET";  u = "$api/videos" },
  @{ m = "GET";  u = "$api/flipbooks" },
  @{ m = "GET";  u = "$api/exams" },
  @{ m = "GET";  u = "$api/exam-results" }
)

$results = foreach ($c in $checks) {
  $body = ""
  if ($null -ne $c.body) {
    $body = [string]$c.body
  }
  Test-Endpoint -Method $c.m -Url $c.u -Body $body
}

Write-Host ""
Write-Host "Deployment Check Results" -ForegroundColor Cyan
Write-Host "Base URL: $base"
Write-Host ""
$results | Format-Table -AutoSize
Write-Host ""

$blocked = $results | Where-Object { $_.VercelProtection -eq "YES" }
if ($blocked.Count -gt 0) {
  Write-Host "Detected Vercel deployment protection on API traffic." -ForegroundColor Yellow
  Write-Host "Disable deployment protection or use a public production domain, then re-run this script."
} else {
  Write-Host "No Vercel protection detected in these checks." -ForegroundColor Green
}
