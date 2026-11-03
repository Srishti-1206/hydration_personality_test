@echo off
title Find Your Hydration Personality
echo ================================================================
echo Starting Find Your Hydration Personality Web Server...
echo ================================================================
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" server.py
) else (
    python server.py
)
pause
