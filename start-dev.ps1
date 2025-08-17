# AvoAlert Development Startup Script
Write-Host "Starting AvoAlert Development Environment..." -ForegroundColor Green

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\frontend\web-client; npm run dev"
Start-Sleep -Seconds 3

# Start Backend API
Write-Host "Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\backend\api; npm run dev"
Start-Sleep -Seconds 3

# Start Signal Worker
Write-Host "Starting Signal Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\backend\api; npm run worker"
Start-Sleep -Seconds 3

# Start Notification Worker
Write-Host "Starting Notification Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\backend\api; npm run notification-worker"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Customer Dashboard: http://localhost:3000/customer/dashboard" -ForegroundColor Green
Write-Host "  Admin Panel: http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "Test: cd apps\backend\api; npm run simulate -- --symbol CRV --action buy" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")