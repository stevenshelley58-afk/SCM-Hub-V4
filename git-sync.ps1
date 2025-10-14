param(
    [string]$Message = "chore: sync changes",
    [switch]$Deploy
)

# Git sync script (idempotent and quiet on no changes)
Write-Host "Aborting any existing rebase..."
git rebase --abort 2>$null

Write-Host "Pulling latest changes..."
git pull --rebase origin main

Write-Host "Adding all changes..."
git add -A

# Commit if there are staged changes
$status = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Committing: $Message"
    git commit -m "$Message"
} else {
    Write-Host "No changes to commit."
}

Write-Host "Pushing to GitHub..."
git push origin main

if ($Deploy) {
    Write-Host "Deploying to GitHub Pages..."
    npm run deploy
}

Write-Host "Sync complete."

