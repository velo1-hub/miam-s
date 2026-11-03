@echo off
rem Windows double-click launcher. Shows the plan first, then asks before moving anything.
cd /d "%~dp0"
python organize_desktop.py
if errorlevel 1 (
  echo.
  echo Python 3 is required. Install it from the Microsoft Store or https://www.python.org/downloads/ and run again.
  pause
  exit /b 1
)
echo.
set /p ans=Apply this plan? [y/N]
if /i "%ans%"=="y" python organize_desktop.py --apply
echo.
pause
