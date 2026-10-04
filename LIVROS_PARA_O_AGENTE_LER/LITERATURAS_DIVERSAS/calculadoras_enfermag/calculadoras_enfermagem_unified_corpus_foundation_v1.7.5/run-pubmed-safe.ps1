if (-not $env:NCBI_EMAIL) { throw 'Set NCBI_EMAIL before live PubMed discovery.' }
python scripts/discover_pubmed.py @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
