param(
    [int]$IntervalSeconds = 60,
    [string]$Message = "chore: auto-push",
    [switch]$Deploy
)

Write-Host "Starting auto-push watcher. Interval: $IntervalSeconds seconds"

while ($true) {
    try {
        & "$PSScriptRoot/../git-sync.ps1" -Message $Message -Deploy:$Deploy
    } catch {
        Write-Warning $_
    }
    Start-Sleep -Seconds $IntervalSeconds
}


