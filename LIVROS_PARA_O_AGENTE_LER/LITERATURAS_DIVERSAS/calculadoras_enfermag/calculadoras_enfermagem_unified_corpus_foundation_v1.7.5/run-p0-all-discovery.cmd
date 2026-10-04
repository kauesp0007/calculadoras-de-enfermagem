@echo off
setlocal
cd /d "%~dp0"
py scripts\run_p0.py --mode discovery --limit-topics 0
endlocal
