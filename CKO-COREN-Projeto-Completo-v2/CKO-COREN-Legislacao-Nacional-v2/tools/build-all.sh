#!/usr/bin/env bash
# Pipeline completo do runtime regulatório CKO-COREN v2.
# A segunda passada do build.mjs é necessária: ela incorpora os gates de PDF
# e os artefatos de mídia produzidos pelos executores Python.
set -euo pipefail
cd "$(dirname "$0")/.."

node tools/build-templates.mjs
node tools/build.mjs
python3 tools/build-pdf.py
python3 tools/build-social.py
node tools/build-sitemap.mjs
node tests/gate-regression.test.mjs
node tools/validate-artifacts.mjs
node tools/audit-a11y.mjs
node tools/build.mjs
python3 tools/build-manifest.py

echo "--- decisão de release ---"
python3 -c "import json;d=json.load(open('assurance/release-decision.json'));print(d['release']);print(json.dumps(d['decisions'],indent=1,ensure_ascii=False))"
