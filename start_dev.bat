@echo off
title Quantaneer - Full Development Server (Hot-Reload)
color 0b

echo ===============================================================================
echo            QUANTANEER - Full Development Environment (Hot-Reload)
echo                Backend:  http://localhost:8000/docs
echo                Frontend: http://localhost:5173
echo ===============================================================================
echo.

cd /d "%~dp0"

echo Starting Backend API with hot-reload in separate window...
start "Quantaneer Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend Dev Server (Vite Hot Reload)...
cd frontend
npm run dev
