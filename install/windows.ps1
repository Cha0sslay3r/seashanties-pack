# Freedom V4: Sea Shanties - one-line installer for Windows (PowerShell).
#   irm https://raw.githubusercontent.com/Cha0sslay3r/seashanties-pack/main/install/windows.ps1 | iex
# Installs Prism Launcher (if missing, per-user, no admin needed), adds the Sea Shanties instance (auto-updates on every Play), opens Prism.
# Safe to run again.  $env:DRY=1 = only print what it would do.
$ErrorActionPreference = 'Stop'
$PackUrl = 'https://raw.githubusercontent.com/Cha0sslay3r/seashanties-pack/main/prism/Freedom-V4-Sea-Shanties-Prism.zip'
$Name = 'Freedom V4: Sea Shanties'
$Dry = [bool]$env:DRY
function Say($m) { Write-Host "==> $m" -ForegroundColor Cyan }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. Prism Launcher: look for an existing install first
$Candidates = @("$env:LOCALAPPDATA\Programs\PrismLauncher\prismlauncher.exe", "$env:ProgramFiles\PrismLauncher\prismlauncher.exe", "$env:LOCALAPPDATA\PrismLauncher\prismlauncher.exe")
$Exe = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Exe) {
  Say 'Downloading Prism Launcher...'
  $arm = $env:PROCESSOR_ARCHITECTURE -eq 'ARM64'
  $pattern = if ($arm) { 'PrismLauncher-Windows-MinGW-arm64-Portable-[0-9.]+\.zip$' } else { 'PrismLauncher-Windows-MinGW-w64-Portable-[0-9.]+\.zip$' }
  $rel = Invoke-RestMethod 'https://api.github.com/repos/PrismLauncher/PrismLauncher/releases/latest' -Headers @{ 'User-Agent' = 'seashanties-installer' }
  $asset = $rel.assets | Where-Object { $_.name -match $pattern } | Select-Object -First 1
  if (-not $asset) { throw 'Could not find the Prism download. Get it from https://prismlauncher.org/download/' }
  $Dest = "$env:LOCALAPPDATA\PrismLauncher"
  $zip = Join-Path $env:TEMP $asset.name
  if ($Dry) { Write-Host "   (dry run) download $($asset.browser_download_url) -> $Dest" }
  else {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest $asset.browser_download_url -OutFile $zip -UseBasicParsing
    Say "Installing Prism Launcher to $Dest..."
    New-Item -ItemType Directory -Force $Dest | Out-Null
    Expand-Archive $zip -DestinationPath $Dest -Force
    Remove-Item $zip
    # the zip may contain a top folder: find the exe
    $found = Get-ChildItem $Dest -Recurse -Filter prismlauncher.exe | Select-Object -First 1
    $Exe = $found.FullName
    # Start Menu + Desktop shortcuts
    $ws = New-Object -ComObject WScript.Shell
    foreach ($lnk in @("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Prism Launcher.lnk", "$([Environment]::GetFolderPath('Desktop'))\Prism Launcher.lnk")) {
      $s = $ws.CreateShortcut($lnk); $s.TargetPath = $Exe; $s.WorkingDirectory = (Split-Path $Exe); $s.Save()
    }
  }
} else { Say 'Prism Launcher is already installed.' }

# 2. The pack (portable Prism keeps instances next to the exe, installed Prism in %APPDATA%)
$Dirs = @("$env:APPDATA\PrismLauncher\instances")
if ($Exe) { $Dirs += (Join-Path (Split-Path $Exe) 'instances') }
$have = $false
foreach ($d in $Dirs) { if (Test-Path $d) { if (Get-ChildItem $d -Recurse -Depth 1 -Filter instance.cfg -ErrorAction SilentlyContinue | Select-String -SimpleMatch "name=$Name" -Quiet) { $have = $true } } }
if ($have) { Say 'Sea Shanties is already in Prism - opening it.'; if (-not $Dry) { Start-Process $Exe } }
else {
  Say 'Adding Sea Shanties to Prism (click OK if Prism asks)...'
  if ($Dry) { Write-Host "   (dry run) $Exe --import $PackUrl" } else { Start-Process $Exe -ArgumentList '--import', $PackUrl }
}
Write-Host ''
Write-Host '  All set! In Prism Launcher:' -ForegroundColor Green
Write-Host '   1. First time only: finish the quick setup and sign in with your Microsoft account'
Write-Host '      (top right: Accounts > Manage Accounts > Add Microsoft). Let Prism download Java if it asks.'
Write-Host '   2. Select "Freedom V4: Sea Shanties" and press Launch.'
Write-Host '      The first launch downloads the mods (a few minutes). The server is already in Multiplayer.'
Write-Host ''
