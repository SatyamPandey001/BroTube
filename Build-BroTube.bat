@echo off
title BroTube - Production Builder
set "PATH=%PATH%;%LOCALAPPDATA%\Python\pythoncore-3.14-64\Lib\site-packages\nodejs_wheel;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"
cd /d "%~dp0"
echo ===================================================
echo   BroTube Production Builder (Installer ^& Portable)
echo ===================================================
echo.
call npm run dist
echo.
if %ERRORLEVEL% equ 0 (
  echo [SUCCESS] BroTube successfully built in dist\ folder!
) else (
  echo [ERROR] Build failed with exit code %ERRORLEVEL%.
)
echo.
pause
