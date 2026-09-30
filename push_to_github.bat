@echo off
title Quantaneer - Push to GitHub
cd /d "%~dp0"

echo ===============================================================================
echo                QUANTANEER - PUSH PROJECT TO GITHUB
echo ===============================================================================
echo.

echo [1/4] Checking Git repository...
if not exist ".git" (
    git init
    git branch -M main
)

echo [2/4] Staging project files (excluding node_modules via .gitignore)...
git add .

echo [3/4] Creating commit...
git commit -m "Quantaneer (QuantumLearn AI) - Complete Verified Release (SIH26140)" >nul 2>&1

echo [4/4] Pushing to GitHub repository...
where gh >nul 2>&1
if %errorlevel% equ 0 (
    gh repo create quantaneer --public --source=. --remote=origin --push
    if %errorlevel% equ 0 (
        echo.
        echo ===============================================================================
        echo [SUCCESS] Quantaneer repository created and pushed to GitHub!
        echo URL: https://github.com/gamerdox/quantaneer
        echo ===============================================================================
        pause
        exit /b 0
    )
)

echo Attempting direct git push...
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo [SUCCESS] Pushed to GitHub repository: https://github.com/gamerdox/quantaneer
    echo ===============================================================================
    pause
    exit /b 0
)

echo.
echo ===============================================================================
echo Notice: GitHub requires authentication to create new repositories.
echo.
echo Step 1: Run 'gh auth login' in your terminal (select GitHub.com -> HTTPS -> Web Browser).
echo Step 2: Re-run this script (push_to_github.bat).
echo.
echo OR create an empty repo named 'quantaneer' at https://github.com/new
echo and then run: git push -u origin main
echo ===============================================================================
pause
