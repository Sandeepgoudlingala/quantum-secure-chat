@echo off
title Launch Hybrid Post-Quantum Cryptographic System
echo ======================================================================
echo  Launching Hybrid PQC Communication System (ML-KEM-768 + AES-256-GCM)
echo ======================================================================
echo Starting FastAPI Backend on http://localhost:8000 ...
start "PQC Backend (FastAPI)" cmd /k "%~dp0run_backend.bat"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "PQC Frontend (Vite)" cmd /k "%~dp0run_frontend.bat"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
pause

