# PrimeTickets — copy new server backups to this PC (off-site copy).
# Downloads any archive from /var/backups/primetickets not already here,
# and keeps the newest $Keep locally. Uses the SSH host alias from
# ~/.ssh/config (key-based, no password).
#
# Run by hand:  powershell -ExecutionPolicy Bypass -File scripts\pull-backup.ps1
# Scheduled by: scripts\install-pull-backup.ps1
param(
  [string]$SshHost = 'zior-vps',
  [string]$Dest = "$env:USERPROFILE\Documents\PrimeTickets-Backups",
  [int]$Keep = 30
)
$ErrorActionPreference = 'Stop'
$log = Join-Path $Dest 'pull-backup.log'
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

function Log($msg) { "$(Get-Date -Format s)  $msg" | Tee-Object -FilePath $log -Append }

try {
  $remote = & ssh -o BatchMode=yes -o ConnectTimeout=20 $SshHost 'ls /var/backups/primetickets/primetickets-*.tar.gz'
  if ($LASTEXITCODE -ne 0) { throw "could not list backups on $SshHost" }

  $new = 0
  foreach ($path in $remote) {
    $name = Split-Path $path -Leaf
    $local = Join-Path $Dest $name
    if (Test-Path $local) { continue }
    & scp -q -o BatchMode=yes "${SshHost}:$path" "$local.part"
    if ($LASTEXITCODE -ne 0) { Remove-Item -ErrorAction SilentlyContinue "$local.part"; throw "download failed: $name" }
    Move-Item "$local.part" $local
    $new++
  }

  Get-ChildItem $Dest -Filter 'primetickets-*.tar.gz' |
    Sort-Object Name -Descending | Select-Object -Skip $Keep | Remove-Item

  $count = (Get-ChildItem $Dest -Filter 'primetickets-*.tar.gz').Count
  Log "ok: $new new, $count kept in $Dest"
} catch {
  Log "ERROR: $_"
  exit 1
}
