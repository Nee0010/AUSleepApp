@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing project packages. This can take several minutes on the first run...
  call npm install
  if errorlevel 1 (
    echo Package installation failed. Review the messages above.
    pause
    exit /b 1
  )
)

echo Starting the web test build...
call npx expo start --web -c
pause
