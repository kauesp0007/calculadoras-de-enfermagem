@echo off
setlocal
cd /d %~dp0
py -m pip install -r requirements.txt
if errorlevel 1 goto :fail
py scripts\download_openrn_mass.py --manifest manifest\openrn_sources.json --out openrn_corpus --priority ALL
if errorlevel 1 goto :fail
py scripts\validate_openrn_corpus.py --manifest manifest\openrn_sources.json --corpus openrn_corpus
if errorlevel 1 goto :fail
py scripts\pack_openrn_corpus.py --corpus openrn_corpus --out openrn_corpus_downloaded
if errorlevel 1 goto :fail
echo.
echo CONCLUIDO. Envie o arquivo openrn_corpus_downloaded.zip para o ChatGPT.
pause
exit /b 0
:fail
echo.
echo O processo encontrou um erro. Envie a tela/erro para revisao.
pause
exit /b 1
