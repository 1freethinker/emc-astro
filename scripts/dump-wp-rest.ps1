<#
  Dumps the raw WordPress REST API collections to scripts/wp-export/ for
  reference / re-syncing content. This is a read-only snapshot tool; it does
  NOT touch src/content.

  Usage (from the project root):
    pwsh ./scripts/dump-wp-rest.ps1 [-Base http://141.164.55.18]
#>
param([string]$Base = 'http://141.164.55.18')

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root 'scripts/wp-export'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$endpoints = 'posts', 'pages', 'categories', 'tags', 'media', 'users'
foreach ($ep in $endpoints) {
  try {
    $r = Invoke-WebRequest -Uri "$Base/wp-json/wp/v2/$ep`?per_page=100&_embed=1" -UseBasicParsing
    $r.Content | Out-File -Encoding utf8 (Join-Path $dest "$ep.json")
    $count = ($r.Content | ConvertFrom-Json).Count
    Write-Host "  $ep : $count"
  } catch {
    Write-Warning "  $ep : $($_.Exception.Message)"
  }
}
Write-Host "`nwrote -> $dest"
