# Minu.AI - One-click validation harness for local machine
# Usage:
#   PowerShell (in repo root):
#     Set-ExecutionPolicy -Scope Process Bypass
#     .\run-all-validation.ps1 -BaseUrl "http://localhost:4000"

param(
  [string]$BaseUrl = "http://localhost:4000"
)

$ErrorActionPreference = 'Continue'

Write-Host "=== Minu.AI Validation Harness ==="
Write-Host "BaseUrl: $BaseUrl"

# 0) Prep folders
New-Item -ItemType Directory -Path "$PSScriptRoot/validation-logs" -Force | Out-Null

# 1) Kill stray node processes
Write-Host "Killing stray node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2) Load env from .env.local into this PowerShell session
function Load-EnvFromFile([string]$path) {
  if (-not (Test-Path $path)) { throw ".env file not found: $path" }
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_.Trim().Length -eq 0) { return }
    $kv = $_ -split '=', 2
    if ($kv.Length -eq 2) {
      $name = $kv[0].Trim(); $value = $kv[1].Trim()
      [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

Write-Host "Loading .env.local ..."
Load-EnvFromFile "$PSScriptRoot/.env.local"
Write-Host ("REPLICATE_API_TOKEN loaded: " + ([string]::IsNullOrEmpty($env:REPLICATE_API_TOKEN) -eq $false))
Write-Host ("REPLICATE_WEBHOOK_SECRET loaded: " + ([string]::IsNullOrEmpty($env:REPLICATE_WEBHOOK_SECRET) -eq $false))
Write-Host ("NEXT_PUBLIC_SUPABASE_URL: " + $env:NEXT_PUBLIC_SUPABASE_URL)

# 3) Start dev server on port 4000 in background (robust Windows start)
Write-Host "Starting dev server (npm run dev) ..."
$serverLog = Join-Path $PSScriptRoot 'validation-logs/server.log'
$serverErr = Join-Path $PSScriptRoot 'validation-logs/server.err.log'

# Prefer next binary directly if available
$nextCmd = Join-Path $PSScriptRoot 'node_modules\.bin\next.cmd'
if (Test-Path $nextCmd) {
  $serverProc = Start-Process -FilePath $nextCmd -ArgumentList 'dev','-p','4000' -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr -PassThru
} else {
  # Fallback to npm via cmd.exe
  $serverProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm','run','dev' -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr -PassThru
}

Start-Sleep -Seconds 3

# 4) Wait for health
Write-Host "Waiting for /api/health ..."
node .\wait-for-health.js "$BaseUrl/api/health" | Tee-Object "$PSScriptRoot/validation-logs/wait-for-health.log"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Server health check timed out. See server logs: $serverLog"
  Write-Host "Attempting lightweight curl of base URL..."
  try { Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host "Base responded" } catch { Write-Host "Base curl failed: $($_.Exception.Message)" }
  try { if (-not $serverProc.HasExited) { $serverProc.Kill() } } catch {}
  exit 1
}

# 5) Execute validation scripts
Write-Host "Running scripts/verify-environment.js ..."
node .\scripts\verify-environment.js | Tee-Object "$PSScriptRoot/validation-logs/verify-environment.log"

Write-Host "Running verify-security-prod.js ..."
node .\verify-security-prod.js | Tee-Object "$PSScriptRoot/validation-logs/verify-security-prod.log"

Write-Host "Running prod-model-validation.js ... (this will make real generation calls)"
$env:BASE_URL = $BaseUrl
node .\prod-model-validation.js | Tee-Object "$PSScriptRoot/validation-logs/prod-model-validation.log"

# 6) Test webhook handler with valid signature (optional sanity)
Write-Host "Sending valid webhook (sanity check) ..."
node .\send-valid-webhook.js | Tee-Object "$PSScriptRoot/validation-logs/send-valid-webhook.log"

# 7) Final summary
Write-Host "=== Validation complete ==="
Write-Host "Artifacts:"
Write-Host " - validation-logs/ (logs for each step)"
Write-Host " - prod-gallery-after.png (final gallery screenshot)"
Write-Host "If any step failed, please share the corresponding log file."

# Note: Keep server running so you can inspect UI at $BaseUrl
Write-Host "Server is still running in the background. Press Enter to stop it."
[void][System.Console]::ReadLine()
try { if (-not $serverProc.HasExited) { $serverProc.Kill() } } catch {}
Write-Host "Server stopped."
