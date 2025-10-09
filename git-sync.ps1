# Git sync script
Write-Host "Aborting any existing rebase..."
git rebase --abort 2>$null

Write-Host "Pulling latest changes..."
git pull origin main

Write-Host "Adding all changes..."
git add .

Write-Host "Committing POD system..."
git commit -m "[Agent 1] Add POD capture system - photos, signature, GPS (impl-43)" 2>$null

Write-Host "Pushing to GitHub..."
git push origin main

Write-Host "Done! Now deploying..."
npm run deploy

Write-Host "Complete!"

