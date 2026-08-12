#requires -Version 5.1
# ZYRA backend auth smoke tests (Local Fallback mode)
# Usage: powershell -ExecutionPolicy Bypass -File .\auth-tests.ps1

$ErrorActionPreference = 'Continue'

$baseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:9000' }
$script:results = @()

function Test-Endpoint {
    param(
        [Parameter(Mandatory)] [string] $Name,
        [Parameter(Mandatory)] [string] $Method,
        [Parameter(Mandatory)] [string] $Url,
        [string] $Body,
        [hashtable] $Headers
    )
    $args = @{ Uri = $Url; Method = $Method; TimeoutSec = 15; ErrorAction = 'SilentlyContinue' }
    if ($Body) {
        $args.Body = $Body
        $args.ContentType = 'application/json'
    }
    if ($Headers) { $args.Headers = $Headers }
    try {
        $resp = Invoke-RestMethod @args
        Write-Host "  [OK]   $Name -> 200 $($resp | Out-String)" -ForegroundColor Green
        $script:results += [pscustomobject]@{ Name = $Name; Status = 'OK'; Response = $resp }
        return $resp
    } catch {
        $code = $null
        $body = $null
        if ($_.Exception.Response) {
            $code = $_.Exception.Response.StatusCode.value__
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
            } catch { }
        }
        if (-not $code) { $code = 'timeout' }
        Write-Host "  [FAIL] $Name -> HTTP $code  $body" -ForegroundColor Red
        $script:results += [pscustomobject]@{ Name = $Name; Status = 'FAIL'; Code = $code; Body = $body }
        return $null
    }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$newEmail = "alice_${ts}@zyra.test"
$dupEmail = "dup_${ts}@zyra.test"

Write-Host ""
Write-Host "=== Health ==="
Test-Endpoint 'GET /' GET "$baseUrl/" | Out-Null

Write-Host ""
Write-Host "=== Register ==="
Test-Endpoint 'Register: missing password' POST "$baseUrl/api/users/register" '{"name":"Alice","email":"a@b.co"}' | Out-Null
Test-Endpoint 'Register: weak password' POST "$baseUrl/api/users/register" '{"name":"Alice","email":"a@b.co","password":"weak"}' | Out-Null
Test-Endpoint 'Register: bad email' POST "$baseUrl/api/users/register" '{"name":"Alice","email":"not-email","password":"StrongP@ss1"}' | Out-Null
Test-Endpoint "Register: $newEmail" POST "$baseUrl/api/users/register" (@{name='Alice Test'; email=$newEmail; password='StrongP@ss1'; role='customer'} | ConvertTo-Json -Compress) | Out-Null
Test-Endpoint "Register: dup $dupEmail" POST "$baseUrl/api/users/register" (@{name='Bob'; email=$dupEmail; password='StrongP@ss1'} | ConvertTo-Json -Compress) | Out-Null
Test-Endpoint "Register: dup again $dupEmail" POST "$baseUrl/api/users/register" (@{name='BobAgain'; email=$dupEmail; password='StrongP@ss1'} | ConvertTo-Json -Compress) | Out-Null

Write-Host ""
Write-Host "=== Login ==="
Test-Endpoint "Login: wrong password" POST "$baseUrl/api/users/login" (@{email=$newEmail; password='wrong'} | ConvertTo-Json -Compress) | Out-Null
Test-Endpoint "Login: missing fields" POST "$baseUrl/api/users/login" '{}' | Out-Null
$login = Test-Endpoint "Login: $newEmail" POST "$baseUrl/api/users/login" (@{email=$newEmail; password='StrongP@ss1'} | ConvertTo-Json -Compress)

Write-Host ""
Write-Host "=== Profile (private) ==="
Test-Endpoint 'Profile: no token' GET "$baseUrl/api/users/profile" | Out-Null
Test-Endpoint 'Profile: bad token' GET "$baseUrl/api/users/profile" @{Authorization='Bearer notatoken'} | Out-Null

if ($login -and $login.token) {
    $token = $login.token
    Write-Host "  captured token: $($token.Substring(0,30))..." -ForegroundColor Cyan
    Test-Endpoint 'Profile: bearer token' GET "$baseUrl/api/users/profile" @{Authorization="Bearer $token"} | Out-Null
    Test-Endpoint "Profile PUT: name only" PUT "$baseUrl/api/users/profile" (@{name='Alice Updated'} | ConvertTo-Json -Compress) @{Authorization="Bearer $token"} | Out-Null
    Test-Endpoint "Profile PUT: weak pw" PUT "$baseUrl/api/users/profile" (@{name='Alice'; password='short'} | ConvertTo-Json -Compress) @{Authorization="Bearer $token"} | Out-Null
    Test-Endpoint "Profile PUT: bad email" PUT "$baseUrl/api/users/profile" (@{email='notanemail'} | ConvertTo-Json -Compress) @{Authorization="Bearer $token"} | Out-Null
    Test-Endpoint "Profile PUT: change pw" PUT "$baseUrl/api/users/profile" (@{name='Alice Updated'; password='StrongerP@ss2'} | ConvertTo-Json -Compress) @{Authorization="Bearer $token"} | Out-Null
    Test-Endpoint 'Login with new pw' POST "$baseUrl/api/users/login" (@{email=$newEmail; password='StrongerP@ss2'} | ConvertTo-Json -Compress) | Out-Null
} else {
    Write-Host '  could not capture login token — Profile tests skipped' -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ==="
$okCount = ($script:results | Where-Object Status -eq 'OK').Count
$failCount = ($script:results | Where-Object Status -eq 'FAIL').Count
Write-Host "  OK:   $okCount" -ForegroundColor Green
Write-Host "  FAIL: $failCount" -ForegroundColor Red
if ($failCount -gt 0) { exit 1 } else { exit 0 }
