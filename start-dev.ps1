# Run from repo root: powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-Task($title, $dir, $cmd) {
  Start-Process -FilePath "powershell.exe" `
    -ArgumentList @(
      "-NoExit",
      "-Command",
      "Write-Host `[${title}] $dir` -ForegroundColor Cyan; cd `"$dir`"; npm install --silent; $cmd"
    ) `
    -WorkingDirectory $dir
}

# 1) API (http://localhost:4000)
Start-Task "API" "$root\apps\backend\api" "npm run dev"

# 2) Worker
Start-Task "Worker" "$root\apps\backend\api" "npm run worker"

# 3) Frontend (http://localhost:3000)
Start-Task "WEB" "$root\apps\frontend\web-client" "$env:NEXT_PUBLIC_API_BASE='http://localhost:4000'; npm run dev"


