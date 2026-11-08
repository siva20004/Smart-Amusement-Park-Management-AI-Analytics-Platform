# Stop any existing processes on 8000 or 5173
$p8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($p8000) { Stop-Process -Id $p8000.OwningProcess -Force -ErrorAction SilentlyContinue }

$p5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($p5173) { Stop-Process -Id $p5173.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1

# Start Backend Server
$backendPath = Join-Path $PSScriptRoot "backend"
$backendProc = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendPath -WindowStyle Hidden -PassThru

# Start Frontend Server
$frontendPath = Join-Path $PSScriptRoot "frontend"
$frontendProc = Start-Process -FilePath "node" -ArgumentList "./node_modules/vite/bin/vite.js --port 5173 --host" -WorkingDirectory $frontendPath -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 3

Write-Host "Backend PID: $($backendProc.Id) on http://127.0.0.1:8000"
Write-Host "Frontend PID: $($frontendProc.Id) on http://localhost:5173"
