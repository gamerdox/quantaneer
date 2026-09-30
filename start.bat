@echo off
title Quantaneer - AI-Based Interactive Quantum Algorithm Learning Platform
color 0b

echo ===============================================================================
echo                QUANTANEER - QuantumLearn AI (SIH26140)
echo        AI-Based Interactive Quantum Algorithm Learning Platform
echo                    Organization: Egreen Quanta
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in PATH!
    pause
    exit /b 1
)

echo [2/2] Launching Quantaneer Unified Production Server (Host: 0.0.0.0:8000)...
echo Platform accessible locally at: http://localhost:8000
echo Platform accessible on your local Wi-Fi / LAN via your PC's IP (port 8000).
echo.
echo Press Ctrl+C in this window to stop the server anytime.
echo.

start http://localhost:8000
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
