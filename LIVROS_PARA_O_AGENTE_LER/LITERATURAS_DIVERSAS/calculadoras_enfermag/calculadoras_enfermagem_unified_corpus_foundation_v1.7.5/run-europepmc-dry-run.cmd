@echo off
py scripts\discover_europepmc.py --limit-topics 5 --page-size 10 --dry-run || exit /b 1
py scripts\validate_europepmc_adapter.py || exit /b 1
