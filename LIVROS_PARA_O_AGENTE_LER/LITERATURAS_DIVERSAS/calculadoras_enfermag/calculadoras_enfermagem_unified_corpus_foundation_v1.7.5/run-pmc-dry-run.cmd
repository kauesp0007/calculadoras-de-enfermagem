@echo off
py scripts\discover_pmc.py --dry-run --limit-topics 5 --max-per-topic 10 || exit /b 1
py scripts\validate_pmc_adapter.py || exit /b 1
