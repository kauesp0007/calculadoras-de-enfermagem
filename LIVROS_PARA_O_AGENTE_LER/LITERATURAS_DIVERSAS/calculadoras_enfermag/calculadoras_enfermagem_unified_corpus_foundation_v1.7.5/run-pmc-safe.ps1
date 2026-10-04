if (-not $env:NCBI_EMAIL) { Write-Error "Configure NCBI_EMAIL before live NCBI calls."; exit 2 }
py scripts/discover_pmc.py --limit-topics 5 --max-per-topic 10
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/verify_pmc_rights.py --max-items 50
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/fetch_pmc_bioc.py --max-items 50
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/validate_pmc_adapter.py
