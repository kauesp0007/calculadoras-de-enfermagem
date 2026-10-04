@echo off
setlocal
cd /d "%~dp0"
py -m pip install -r scripts\requirements.txt
if errorlevel 1 exit /b %errorlevel%
py scripts\validate_foundation.py
py scripts\run_p0.py --mode dry-run --limit-topics 5
endlocal
