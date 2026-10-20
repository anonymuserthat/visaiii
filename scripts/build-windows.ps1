param([switch]$Demo)
$ErrorActionPreference = 'Stop'
if ([Environment]::OSVersion.Platform -ne 'Win32NT') {
  throw 'Run this script on Windows with Node.js 24, Rust MSVC and Microsoft C++ Build Tools installed.'
}
foreach ($program in @('node', 'npm.cmd', 'cargo')) {
  if (-not (Get-Command $program -ErrorAction SilentlyContinue)) { throw "Missing prerequisite: $program" }
}
$projectRoot = Split-Path $PSScriptRoot -Parent
$previousMode = $env:VITE_MOCK_MODE
Push-Location $projectRoot
try {
  $env:VITE_MOCK_MODE = if ($Demo) { 'true' } else { 'false' }
  & npm.cmd ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
  & npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) { throw 'Type checking failed.' }
  & npm.cmd test -- --maxWorkers=1 --pool=threads
  if ($LASTEXITCODE -ne 0) { throw 'Tests failed.' }
  & npm.cmd run build:tauri -- --ci --bundles nsis -- --locked
  if ($LASTEXITCODE -ne 0) { throw 'Windows build failed.' }
  $installers = @(Get-ChildItem 'src-tauri/target/release/bundle/nsis/*0.3.0*.exe' -ErrorAction SilentlyContinue)
  if ($installers.Count -eq 0) { throw 'The build did not produce a version 0.3.0 installer.' }
  foreach ($installer in $installers) {
    Write-Host "Installer: $($installer.FullName)"
    Get-FileHash -Algorithm SHA256 $installer.FullName | Format-List
  }
} finally {
  Pop-Location
  $env:VITE_MOCK_MODE = $previousMode
}
