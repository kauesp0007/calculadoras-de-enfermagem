@echo off
setlocal
if "%NCBI_EMAIL%"=="" (
  echo ERROR: set NCBI_EMAIL before live PubMed discovery.
  echo Example: set NCBI_EMAIL=you@example.com
  exit /b 2
)
py scripts\discover_pubmed.py %*
if errorlevel 1 exit /b %errorlevel%
endlocal
