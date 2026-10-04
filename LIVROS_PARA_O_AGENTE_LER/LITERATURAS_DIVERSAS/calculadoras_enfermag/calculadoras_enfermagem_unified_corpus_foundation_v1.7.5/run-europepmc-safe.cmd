@echo off
setlocal
py scripts\discover_europepmc.py --limit-topics 5 --page-size 10 || exit /b 1
py scripts\verify_europepmc_rights.py --max-items 50 || exit /b 1
py scripts\fetch_europepmc_fulltext.py --max-items 50 || exit /b 1
py scripts\validate_europepmc_adapter.py || exit /b 1
echo Europe PMC bounded acquisition completed. Review workspace\metadata before atomization.
