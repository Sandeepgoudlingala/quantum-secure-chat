@echo off
title PQC Frontend (Vite React)
set "PATH=%~dp0node-bin;%PATH%"
cd /d "%~dp0frontend"
call "%~dp0node-bin\npm.cmd" run dev

