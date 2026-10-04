@echo off
setlocal
cd /d "%~dp0"
py scripts\run_p0.py --mode safe --limit-topics 25
endlocal
