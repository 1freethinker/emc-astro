<#
  Downloads every image listed in src/data/wordpress-images.json into
  public/images/ using the `localPath` mapping (so the two clashing logo.png
  files land under different names).

  Usage (from the project root):
    pwsh ./scripts/fetch-wp-images.ps1

  Re-run safe: existing files are skipped unless -Force is passed.
#>
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $root 'src/data/wordpress-images.json'
$destDir = Join-Path $root 'public/images'

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$ok = 0; $skip = 0; $fail = 0
foreach ($img in $manifest.images) {
  $name = ($img.localPath -replace '^/images/', '')
  $dest = Join-Path $destDir $name
  if ((Test-Path $dest) -and -not $Force) { $skip++; continue }
  try {
    Invoke-WebRequest -Uri $img.sourceUrl -OutFile $dest -UseBasicParsing
    Write-Host "  ok   $name"
    $ok++
  } catch {
    Write-Warning "  FAIL $name  <-  $($img.sourceUrl)  ($($_.Exception.Message))"
    $fail++
  }
}
Write-Host ""
Write-Host "downloaded $ok, skipped $skip, failed $fail  ->  $destDir"
