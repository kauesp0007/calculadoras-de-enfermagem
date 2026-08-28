#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/build-manifest.py — E-020

Manifesto SHA-256 de todos os arquivos do pacote MAIS o índice de lineage por
artefato. O manifesto prova integridade de entrega; o lineage prova a cadeia
source → evidence → projection → output. Os dois são necessários e nenhum
substitui o outro.
"""
import json, hashlib, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
NOW = "2026-08-26T12:00:00Z"
SKIP = {"manifest.sha256.json"}


def sha256(p: pathlib.Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    files = {}
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file():
            continue
        rel = str(p.relative_to(ROOT))
        if rel in SKIP or "/__pycache__/" in rel:
            continue
        files[rel] = {"sha256": sha256(p), "bytes": p.stat().st_size}

    lineage = []
    for name in ("generated/lineage.json", "generated/pdf-lineage.json", "generated/social-lineage.json"):
        f = ROOT / name
        if f.exists():
            lineage += json.loads(f.read_text(encoding="utf-8"))["artifacts"]

    covered = {l["output"]["path"] for l in lineage}
    social = ROOT / "generated/social-lineage.json"
    if social.exists():
        for r in json.loads(social.read_text(encoding="utf-8")).get("index_artifacts", []):
            covered.add(r["output"])
    generated = {f for f in files
                 if f.startswith(("generated/resources/", "generated/social-html/",
                                  "generated/pdf-src/", "generated/pdfs/", "generated/social/"))}
    uncovered = sorted(generated - covered)

    manifest = {
        "manifest_id": "CKO-COREN-MANIFEST-v2",
        "generated_at": NOW,
        "policy": ("O hash de arquivo prova integridade de entrega. Ele NÃO substitui source hash, "
                   "projection lineage, output hash e version envelope — por isso o índice de lineage "
                   "abaixo é parte do manifesto."),
        "file_count": len(files),
        "total_bytes": sum(v["bytes"] for v in files.values()),
        "files": files,
        "lineage_index": {
            "artifacts": len(lineage),
            "chain": "canonical_sha256 → evidence_refs → dto_sha256 → output.sha256",
            "uncovered_artifacts": uncovered,
            "entries": [
                {"lineage_id": l["lineage_id"], "canonical_id": l["canonical_id"],
                 "projection_id": l["projection_id"], "output": l["output"]["path"],
                 "output_sha256": l["output"]["sha256"], "versions": l["versions"]}
                for l in sorted(lineage, key=lambda x: x["lineage_id"])
            ],
        },
    }
    (ROOT / "manifest.sha256.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(files), "lineage": len(lineage),
                      "uncovered": len(uncovered)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
