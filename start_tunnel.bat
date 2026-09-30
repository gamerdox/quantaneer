@echo off
title Quantaneer - Universal Public HTTPS Tunnel
color 0e

echo ===============================================================================
echo           QUANTANEER - Universal Remote / Mobile Access Tunnel
echo    Exposes http://localhost:8000 securely via HTTPS for phone or remote demos
echo ===============================================================================
echo.

echo Make sure Quantaneer server is running (via start.bat or start_dev.bat)!
echo.
echo Launching localtunnel on port 8000...
npx localtunnel --port 8000
pause
