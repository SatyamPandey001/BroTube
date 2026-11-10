@echo off
title BroTube - Spatial YouTube Client & Lossless Downloader
set "PATH=%PATH%;%LOCALAPPDATA%\Python\pythoncore-3.14-64\Lib\site-packages\nodejs_wheel;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-essentials_build\bin"
cd /d "%~dp0"
echo Starting BroTube...
call npm start
