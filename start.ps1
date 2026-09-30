# Quantaneer PowerShell Launch Script
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "               QUANTANEER - QuantumLearn AI (SIH26140)" -ForegroundColor White
Write-Host "       AI-Based Interactive Quantum Algorithm Learning Platform" -ForegroundColor Cyan
Write-Host "                   Organization: Egreen Quanta" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\backend"

$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object { $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

Write-Host "Local Access:  http://localhost:8000" -ForegroundColor Green
if ($localIp) {
    Write-Host "Mobile/LAN:    http://$($localIp):8000" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Launching Quantaneer FastAPI Backend & Web Server..." -ForegroundColor Green
Start-Process "http://localhost:8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
