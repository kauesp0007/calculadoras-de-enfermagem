@echo off
cd /d "%~dp0"
py scripts\discover_scielo.py --dry-run --limit-topics 10
