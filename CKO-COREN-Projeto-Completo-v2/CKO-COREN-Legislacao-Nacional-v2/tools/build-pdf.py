#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/build-pdf.py — N-026 / N-027

PDF Projection DTO -> PDF Renderer (HTML) -> PDF/UA-1 tagged -> PDF Validator.

Nenhum PDF e publicado sem passar pelo validador. O resultado alimenta o
gate PDF_PASS consumido por tools/build.mjs na segunda passada.
"""
import json, hashlib, pathlib, sys, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "generated/pdf-src"
OUT = ROOT / "generated/pdfs"
NOW = "2026-08-26T12:00:00Z"

try:
    from weasyprint import HTML  # noqa: E402
    import pikepdf  # noqa: E402
    PDF_RUNTIME_ERROR = None
except (ImportError, OSError) as error:
    HTML = None
    pikepdf = None
    PDF_RUNTIME_ERROR = str(error)


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canonical_hash(canonical_id: str) -> str:
    """Mesmo hash que tools/build.mjs calcula: JSON compacto na ordem original.

    A paridade com JSON.stringify do Node é o que torna o lineage reperformável
    dos dois lados do pipeline.
    """
    for f in (ROOT / "canonical/acts").glob("*.json"):
        obj = json.loads(f.read_text(encoding="utf-8"))
        if obj.get("canonical_id") == canonical_id:
            return hashlib.sha256(
                json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            ).hexdigest()
    raise KeyError(f"canônico não encontrado para {canonical_id}")


def render(src: pathlib.Path, dst: pathlib.Path, title: str, author: str, subject: str):
    doc = HTML(filename=str(src)).render()
    doc.metadata.title = title
    doc.metadata.authors = [author]
    doc.metadata.description = subject
    doc.metadata.keywords = ["COREN", "legislacao", "enfermagem", "ato regional"]
    doc.metadata.generator = "CKO-COREN pdf-renderer@1.0.0 (WeasyPrint)"
    doc.write_pdf(str(dst), pdf_variant="pdf/ua-1")


def validate(path: pathlib.Path) -> dict:
    """N-027 — estrutura marcada, metadados, bookmarks e hash de saida."""
    findings = []
    with pikepdf.open(str(path)) as pdf:
        root = pdf.Root
        marked = bool(root.get("/MarkInfo", {}).get("/Marked", False))
        has_struct = "/StructTreeRoot" in root
        lang = str(root.get("/Lang", "")) or None
        outlines = "/Outlines" in root
        n_outline = 0
        if outlines:
            o = root["/Outlines"]
            n_outline = int(o.get("/Count", 0))
        with pdf.open_metadata() as meta:
            title = meta.get("dc:title")
            creator = meta.get("dc:creator")
            desc = meta.get("dc:description")
            ua = meta.get("pdfuaid:part")
        docinfo_title = str(pdf.docinfo.get("/Title", "")) or None
        docinfo_author = str(pdf.docinfo.get("/Author", "")) or None
        pages = len(pdf.pages)

    if not marked:
        findings.append({"code": "PDF-001", "severity": "P0", "subject": path.name,
                         "message": "PDF nao marcado (/MarkInfo /Marked ausente)."})
    if not has_struct:
        findings.append({"code": "PDF-002", "severity": "P0", "subject": path.name,
                         "message": "Sem StructTreeRoot: estrutura de leitura inexistente."})
    if not lang:
        findings.append({"code": "PDF-003", "severity": "P0", "subject": path.name,
                         "message": "Idioma do documento nao declarado (/Lang)."})
    if not (title or docinfo_title) or (docinfo_title or "").lower() in ("", "untitled"):
        if not title:
            findings.append({"code": "PDF-004", "severity": "P0", "subject": path.name,
                             "message": "Titulo do documento ausente ou 'untitled'."})
    if not (creator or docinfo_author) or (docinfo_author or "").lower() in ("", "anonymous"):
        if not creator:
            findings.append({"code": "PDF-005", "severity": "P1", "subject": path.name,
                             "message": "Autor ausente ou 'anonymous'."})
    if not desc:
        findings.append({"code": "PDF-006", "severity": "P1", "subject": path.name,
                         "message": "Assunto/descricao ausente."})
    if not ua:
        findings.append({"code": "PDF-007", "severity": "P1", "subject": path.name,
                         "message": "Identificador PDF/UA ausente no XMP."})
    if n_outline == 0:
        findings.append({"code": "PDF-008", "severity": "P1", "subject": path.name,
                         "message": "Sem bookmarks/outline derivados dos titulos."})

    return {
        "file": str(path.relative_to(ROOT)),
        "pages": pages, "tagged": marked, "struct_tree": has_struct, "lang": lang,
        "xmp_title": str(title) if title else None,
        "xmp_creator": str(creator) if creator else None,
        "pdfua_part": str(ua) if ua else None,
        "outline_entries": n_outline,
        "sha256": sha256(path.read_bytes()),
        "byte_length": path.stat().st_size,
        "findings": findings,
    }


def main():
    if PDF_RUNTIME_ERROR:
        report = {
            "report_id": "CKO-COREN-PDF-VALIDATION-v2",
            "generated_at": NOW,
            "result": "NOT_EXECUTED",
            "basis": "Geração de PDF não executada porque o runtime do WeasyPrint não está disponível.",
            "documents": [],
            "findings": [{
                "code": "PDF-ENV-001",
                "severity": "P0",
                "subject": "tools/build-pdf.py",
                "message": "Dependência Python ou biblioteca nativa do WeasyPrint indisponível: " + PDF_RUNTIME_ERROR,
            }],
        }
        (ROOT / "generated/pdf-validation.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (ROOT / "generated/pdf-lineage.json").write_text(
            json.dumps({"artifacts": []}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"pdfs": 0, "result": "NOT_EXECUTED", "findings": 1}, ensure_ascii=False))
        return

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.pdf"):
        old.unlink()

    catalog = json.loads((ROOT / "data/acts.catalog.json").read_text(encoding="utf-8"))
    by_id = {a["canonical_id"]: a for a in catalog["acts"]}

    results, lineage = [], []
    srcs = sorted(SRC.glob("*.html")) if SRC.exists() else []
    if not srcs:
        print("nenhum pdf-src encontrado; rode tools/build.mjs antes", file=sys.stderr)

    for src in srcs:
        stem = src.stem                      # br-coren-sp-...-summary
        cid = None
        for k in by_id:
            if stem.startswith(k.lower()):
                cid = k
                break
        family = stem[len(cid) + 1:] if cid else stem.rsplit("-", 1)[-1]
        act = by_id.get(cid, {})
        dst = OUT / f"{stem}.pdf"
        title = f'{act.get("identifier", stem)} — {"Resumo" if family == "summary" else "Guia de bolso"}'
        render(src, dst, title,
               "Calculadoras de Enfermagem — CKO COREN",
               f'Projecao pdf/{family} do ato {cid}. Fonte oficial: {act.get("source_url","")}')
        res = validate(dst)
        res.update({"canonical_id": cid, "projection_id": f"pdf/{family}"})
        results.append(res)
        lineage.append({
            "lineage_id": f"LIN-{cid}-pdf-{family}",
            "canonical_id": cid, "projection_id": f"pdf/{family}", "surface": "pdf",
            "versions": {"schema": "2.0.0", "content": "1.0.0",
                         "engine": "projection-engine@1.0.0", "validator": "pdf-validator@1.0.0",
                         "renderer": "pdf-renderer@1.0.0 + weasyprint", "template": "2.0.0"},
            "inputs": {"canonical_sha256": canonical_hash(cid),
                       "evidence_source_refs": act.get("evidence_source_refs", []),
                       "evidence_fragment_refs": [],
                       "intermediate_sha256": sha256(src.read_bytes()),
                       "intermediate_path": str(src.relative_to(ROOT)),
                       "deterministic": True},
            "output": {"path": str(dst.relative_to(ROOT)), "sha256": res["sha256"],
                       "byte_length": res["byte_length"], "mime_type": "application/pdf"},
            "assurance_ref": "CKO-COREN-ASSURANCE-v2",
            "generated_at": NOW,
        })

    findings = [f for r in results for f in r["findings"]]
    result = ("FAIL" if any(f["severity"] == "P0" for f in findings) or not results
              else ("PASS_WITH_FINDINGS" if findings else "PASS"))
    report = {
        "report_id": "CKO-COREN-PDF-VALIDATION-v2",
        "generated_at": NOW,
        "result": result,
        "basis": ("PDFs gerados como PDF/UA-1 com estrutura marcada, idioma, metadados e bookmarks, "
                  "e conferidos individualmente pelo pdf-validator."),
        "documents": results,
        "findings": findings,
    }
    (ROOT / "generated/pdf-validation.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "generated/pdf-lineage.json").write_text(
        json.dumps({"artifacts": lineage}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pdfs": len(results), "result": result,
                      "findings": len(findings)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
