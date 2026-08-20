# Reclaims the space Docker's WSL virtual disk holds on C:.
#
# The e2e pre-push gate leaves ~2-3 GB of build cache per run. `docker builder
# prune -af` frees that space *inside* Docker, but the backing .vhdx never
# shrinks on its own - it stays at its high-water mark. Compacting it is the
# only way to give the space back to C:, and diskpart requires elevation, which
# is why this is a separate script rather than part of the gate.
#
# `wsl --manage docker-desktop --set-sparse true` is NOT an alternative: WSL
# disables sparse VHDs over a data-corruption risk, and the dev Postgres volume
# lives on that disk.
#
# Run in an ELEVATED PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\compact-docker-disk.ps1
#
# Docker stops for the duration and is restarted at the end.

$ErrorActionPreference = "Stop"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "This script needs administrator rights (diskpart)." -ForegroundColor Yellow
  Write-Host "Re-launching elevated - accept the UAC prompt." -ForegroundColor Yellow
  $quoted = '"' + $PSCommandPath + '"'
  Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -NoExit -File $quoted"
  return
}

$vhdx = Join-Path $env:LOCALAPPDATA "Docker\wsl\disk\docker_data.vhdx"
if (-not (Test-Path $vhdx)) {
  # Older Docker Desktop layouts keep it under a docker-desktop-data distro.
  $fallback = Join-Path $env:LOCALAPPDATA "Docker\wsl\data\ext4.vhdx"
  if (Test-Path $fallback) { $vhdx = $fallback }
  else { throw "Docker WSL disk not found. Looked in $env:LOCALAPPDATA\Docker\wsl." }
}

$before = [math]::Round((Get-Item $vhdx).Length / 1GB, 1)
Write-Host "Disk: $vhdx" -ForegroundColor Cyan
Write-Host "Size before: $before GB" -ForegroundColor Cyan

Write-Host "Stopping WSL (this stops Docker)..." -ForegroundColor Cyan
wsl --shutdown
Start-Sleep -Seconds 5

$lines = @(
  ('select vdisk file="' + $vhdx + '"'),
  'attach vdisk readonly',
  'compact vdisk',
  'detach vdisk',
  'exit'
)
$scriptPath = Join-Path $env:TEMP "compact-docker-disk.txt"
Set-Content -Path $scriptPath -Value $lines -Encoding ascii

Write-Host "Compacting - this can take several minutes..." -ForegroundColor Cyan
diskpart /s $scriptPath
Remove-Item $scriptPath -ErrorAction SilentlyContinue

$after = [math]::Round((Get-Item $vhdx).Length / 1GB, 1)
$freed = [math]::Round($before - $after, 1)
Write-Host "Size after: $after GB - reclaimed $freed GB" -ForegroundColor Green

$docker = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"
if (Test-Path $docker) {
  Write-Host "Restarting Docker Desktop..." -ForegroundColor Cyan
  Start-Process $docker
  Write-Host "Once the engine is up, bring the dev database back with: docker compose up -d db" -ForegroundColor Yellow
} else {
  Write-Host "Start Docker Desktop manually, then: docker compose up -d db" -ForegroundColor Yellow
}
