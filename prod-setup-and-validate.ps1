# Minu.AI Production Validation - One-click setup and run (Windows PowerShell)
# - Downloads & configures ngrok (if not present)
# - Starts HTTPS tunnel to port 4000 and discovers public URL
# - Retrieves Replicate default webhook secret via API
# - Exports required environment variables for production server
# - Starts Next.js production server on port 4000
# - Runs verification scripts for security and full model validation
#
# Prereqs: Node.js, npm, PowerShell 5+, internet access
# Uses credentials in .env.local where available

$ErrorActionPreference = 'Stop'

function Get-EnvFromDotEnv($path) {
  $envs = @{}
  if (Test-Path $path) {
    Get-Content $path | ForEach-Object {
      if ($_ -match '^(\s*#|\s*$)') { return }
      $parts = $_ -split '=', 2
      if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $envs[$key] = $val
      }
    }
  }
  return $envs
}

function Ensure-Ngrok() {
  $ngrokDir = Join-Path (Get-Location) 'ngrok-bin'
  $ngrokExe = Join-Path $ngrokDir 'ngrok.exe'
  if (-not (Test-Path $ngrokExe)) {
    Write-Host 'Downloading ngrok...'
    New-Item -ItemType Directory -Force -Path $ngrokDir | Out-Null
    $zipPath = Join-Path $ngrokDir 'ngrok.zip'
    $ngrokUrl = 'https://ngrok-agent.s3.amazonaws.com/ngrok-windows-amd64.zip'
    Invoke-WebRequest -Uri $ngrokUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $ngrokDir -Force
    Remove-Item $zipPath -Force
  }
  return $ngrokExe
}

function Start-NgrokTunnel($ngrokExe, $authToken, $port) {
  Write-Host 'Configuring ngrok authtoken...'
  & $ngrokExe config add-authtoken $authToken | Out-Null

  Write-Host "Starting ngrok tunnel on port $port ..."
  Start-Process -FilePath $ngrokExe -ArgumentList @('http', "$port") -WindowStyle Hidden | Out-Null

  # Wait for local API to be ready
  $t0 = Get-Date
  $publicUrl = $null
  while ((Get-Date) - $t0 -lt [TimeSpan]::FromSeconds(30)) {
    Start-Sleep -Milliseconds 800
    try {
      $tunnels = Invoke-WebRequest -Uri 'http://127.0.0.1:4040/api/tunnels' -UseBasicParsing -TimeoutSec 3 | ConvertFrom-Json
      $httpsTunnel = $tunnels.tunnels | Where-Object { $_.public_url -like 'https://*' } | Select-Object -First 1
      if ($httpsTunnel) { $publicUrl = $httpsTunnel.public_url; break }
    } catch { }
  }
  if (-not $publicUrl) { throw 'Failed to establish ngrok tunnel (no public_url found within 30s).' }
  return $publicUrl
}

function Get-ReplicateWebhookSecret($apiToken) {
  Write-Host 'Retrieving Replicate default webhook secret...'
  $headers = @{ Authorization = 'Bearer ' + $apiToken }
  $resp = Invoke-WebRequest -Uri 'https://api.replicate.com/v1/webhooks/default/secret' -Headers $headers -UseBasicParsing -TimeoutSec 15
  $json = $resp.Content | ConvertFrom-Json
  if (-not $json.key) { throw 'Webhook secret not found in response.' }
  return $json.key
}

function Wait-For-Server($url, $timeoutSec) {
  $t0 = Get-Date
  while ((Get-Date) - $t0 -lt [TimeSpan]::FromSeconds($timeoutSec)) {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
      if ($r.StatusCode -eq 200) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 800
  }
  return $false
}

# Load .env.local
$dotEnv = Get-EnvFromDotEnv '.env.local'
# Ensure critical tokens
if (-not $env:REPLICATE_API_TOKEN) { $env:REPLICATE_API_TOKEN = $dotEnv['REPLICATE_API_TOKEN'] }
if (-not $env:CLOUDINARY_URL -and $dotEnv['CLOUDINARY_URL']) { $env:CLOUDINARY_URL = $dotEnv['CLOUDINARY_URL'] }
if (-not $env:CLOUDINARY_CLOUD_NAME -and $dotEnv['CLOUDINARY_CLOUD_NAME']) { $env:CLOUDINARY_CLOUD_NAME = $dotEnv['CLOUDINARY_CLOUD_NAME'] }
if (-not $env:CLOUDINARY_API_KEY -and $dotEnv['CLOUDINARY_API_KEY']) { $env:CLOUDINARY_API_KEY = $dotEnv['CLOUDINARY_API_KEY'] }
if (-not $env:CLOUDINARY_API_SECRET -and $dotEnv['CLOUDINARY_API_SECRET']) { $env:CLOUDINARY_API_SECRET = $dotEnv['CLOUDINARY_API_SECRET'] }
if (-not $env:NEXT_PUBLIC_SUPABASE_URL -and $dotEnv['NEXT_PUBLIC_SUPABASE_URL']) { $env:NEXT_PUBLIC_SUPABASE_URL = $dotEnv['NEXT_PUBLIC_SUPABASE_URL'] }
if (-not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY -and $dotEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY']) { $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $dotEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY'] }

if (-not $env:REPLICATE_API_TOKEN) { throw 'Missing REPLICATE_API_TOKEN in environment or .env.local' }

# Ensure production env
$env:NODE_ENV = 'production'

# Ensure ngrok
$ngrokExe = Ensure-Ngrok
$ngrokUrl = Start-NgrokTunnel -ngrokExe $ngrokExe -authToken '3278bWNwz8lj7rlu94QuR8qbm3R_2h5diuKWN2GDvb52VJT3W' -port 4000
Write-Host ("ngrok public URL: " + $ngrokUrl)

# Fetch webhook secret
$secret = Get-ReplicateWebhookSecret -apiToken $env:REPLICATE_API_TOKEN
$env:REPLICATE_WEBHOOK_SECRET = $secret
$env:REPLICATE_WEBHOOK_URL = "$ngrokUrl/api/replicate/webhook"

# Start Next.js production server
Write-Host 'Starting Next.js production server on port 4000...'
Start-Process -FilePath 'npx' -ArgumentList @('next', 'start', '-p', '4000') -WindowStyle Hidden | Out-Null

# Wait for health
if (-not (Wait-For-Server -url 'http://localhost:4000/api/health' -timeoutSec 60)) {
  throw 'Next.js server did not become healthy within 60s.'
}

# Quick header check
try {
  $h = Invoke-WebRequest -Uri 'http://localhost:4000/api/health' -UseBasicParsing
  Write-Host ('Health STATUS: ' + $h.StatusCode)
  Write-Host ('Cache-Control: ' + $h.Headers['Cache-Control'])
} catch {}

# Run verification scripts
Write-Host 'Running verification scripts...'
node verify-security-prod.js
node prod-model-validation.js

Write-Host 'All tasks executed. Check console output and prod-gallery-after.png for results.'

