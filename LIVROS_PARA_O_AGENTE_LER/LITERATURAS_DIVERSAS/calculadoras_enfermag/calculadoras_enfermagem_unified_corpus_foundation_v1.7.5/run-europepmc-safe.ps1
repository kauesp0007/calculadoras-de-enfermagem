py scripts/discover_europepmc.py --limit-topics 5 --page-size 10
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/verify_europepmc_rights.py --max-items 50
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/fetch_europepmc_fulltext.py --max-items 50
if ($LASTEXITCODE) { exit $LASTEXITCODE }
py scripts/validate_europepmc_adapter.py
