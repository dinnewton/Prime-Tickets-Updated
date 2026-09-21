# Register a daily Windows task that runs pull-backup.ps1 at 10:00, or as
# soon as possible after that if the PC was off. Runs as the current user.
$script = Join-Path $PSScriptRoot 'pull-backup.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At 10:00
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName 'PrimeTickets backup pull' -Action $action -Trigger $trigger `
  -Settings $settings -Description 'Copies PrimeTickets server backups to this PC' -Force | Out-Null
Write-Output "Registered task 'PrimeTickets backup pull' (daily 10:00, catches up if missed)."
