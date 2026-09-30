@echo off
title Quantaneer - Push to GitHub
cd /d "%~dp0"

echo ===============================================================================
echo                QUANTANEER - PUSH PROJECT TO GITHUB
echo ===============================================================================
echo.

echo [1/4] Initializing Git repository...
if not exist ".git" (
    git init
    git branch -M main
)

echo [2/4] Staging project files (excluding node_modules via .gitignore)...
git add .

echo [3/4] Creating commit...
git commit -m "Quantaneer (QuantumLearn AI) - Complete Verified Release (SIH26140)"

echo [4/4] Creating repository 'quantaneer' on GitHub and pushing...
where gh >nul 2>&1
if %errorlevel% equ 0 (
    gh repo create quantaneer --public --source=. --remote=origin --push
    if %errorlevel% equ 0 (
        echo.
        echo ===============================================================================
        echo [SUCCESS] Quantaneer repository created and pushed to GitHub!
        echo ===============================================================================
        exit /b 0
    )
)

echo.
echo ===============================================================================
echo Notice: If GitHub CLI (gh) is not logged in yet, run:
echo   1. gh auth login
echo   2. gh repo create quantaneer --public --source=. --remote=origin --push
echo Or if you already created the repo on github.com:
echo   git remote add origin https://github.com/YOUR_USERNAME/quantaneer.git
echo   git push -u origin main
echo ===============================================================================
