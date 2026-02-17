$folderName = "leetcode-companywise-interview-questions"
$repoUrl = "https://github.com/snehasishroy/leetcode-companywise-interview-questions.git"

if (Test-Path -Path $folderName) {
  Write-Host "Directory $folderName exists."
  Write-Host "Pulling latest changes..."
  Set-Location $folderName
  git pull
  Set-Location ..
} else {
  Write-Host "Directory $folderName does not exist."
  Write-Host "Cloning repository..."
  git clone $repoUrl
}

Write-Host "Done."
