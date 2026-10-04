#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 scripts/run_p0.py --mode safe --limit-topics 25
