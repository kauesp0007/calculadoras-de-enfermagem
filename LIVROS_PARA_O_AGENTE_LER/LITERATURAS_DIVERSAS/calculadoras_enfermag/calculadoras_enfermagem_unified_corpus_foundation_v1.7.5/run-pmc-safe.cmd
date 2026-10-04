@echo off
setlocal
if "%NCBI_EMAIL%"=="" (
  echo ERROR: configure NCBI_EMAIL before live NCBI calls.
  echo Example: set NCBI_EMAIL=you@example.com
  exit /b 2
)
py scripts\discover_pmc.py --limit-topics 5 --max-per-topic 10 || exit /b 1
py scripts\verify_pmc_rights.py --max-items 50 || exit /b 1
py scripts\fetch_pmc_bioc.py --max-items 50 || exit /b 1
py scripts\validate_pmc_adapter.py || exit /b 1
echo PMC bounded acquisition completed. Review workspace\metadata before atomization.
