#!/usr/bin/env python3
"""Generate English WebP catalog previews from the canonical English PDFs."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_FILE = ROOT / "scripts" / "english-assistential-preview-map.json"
OUTPUT_DIR = ROOT / "img" / "formularios-previas" / "en"


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def validate_webp(path: Path) -> None:
    data = path.read_bytes()
    if len(data) < 2048 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise RuntimeError(f"Invalid WebP generated: {path.relative_to(ROOT)}")


def main() -> None:
    entries = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    ids = [entry["id"] for entry in entries]
    if len(entries) != 63 or len(set(ids)) != len(ids):
        raise RuntimeError("English preview map must contain exactly 63 unique IDs")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="english-form-previews-") as temp:
        temp_dir = Path(temp)
        for entry in entries:
            form_id = entry["id"]
            pdf = ROOT / entry["pdf"]
            if not pdf.is_file():
                raise FileNotFoundError(f"Missing English PDF: {pdf.relative_to(ROOT)}")
            if "FORMULARIOS_DE_ESCALAS/EN/" not in pdf.as_posix():
                raise RuntimeError(f"Non-English source rejected: {pdf.relative_to(ROOT)}")

            png_base = temp_dir / form_id
            png = temp_dir / f"{form_id}.png"
            output = OUTPUT_DIR / f"{form_id}.webp"

            run([
                "pdftoppm", "-f", "1", "-l", "1", "-singlefile", "-png",
                "-scale-to-x", "878", "-scale-to-y", "-1",
                str(pdf), str(png_base),
            ])
            run(["cwebp", "-quiet", "-q", "78", "-resize", "439", "0", str(png), "-o", str(output)])
            validate_webp(output)
            print(f"OK {form_id}: {pdf.relative_to(ROOT)} -> {output.relative_to(ROOT)}")

    generated = [OUTPUT_DIR / f"{form_id}.webp" for form_id in ids]
    if not all(path.is_file() for path in generated):
        raise RuntimeError("One or more English previews were not generated")
    print(f"PASS: {len(generated)} English previews generated and validated")


if __name__ == "__main__":
    main()
