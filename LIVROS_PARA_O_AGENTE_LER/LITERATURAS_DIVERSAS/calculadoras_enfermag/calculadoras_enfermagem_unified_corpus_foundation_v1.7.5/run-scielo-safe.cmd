@echo off
setlocal
cd /d "%~dp0"
py scripts\discover_scielo.py --download-dump
if errorlevel 1 exit /b %errorlevel%
py scripts\validate_scielo_adapter.py
exit /b %errorlevel%
