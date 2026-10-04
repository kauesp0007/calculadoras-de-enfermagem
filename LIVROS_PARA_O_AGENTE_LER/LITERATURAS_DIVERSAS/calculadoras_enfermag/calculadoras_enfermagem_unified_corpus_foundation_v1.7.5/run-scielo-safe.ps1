$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
py scripts/discover_scielo.py --download-dump
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
py scripts/validate_scielo_adapter.py
exit $LASTEXITCODE
