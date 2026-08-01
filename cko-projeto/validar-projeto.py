#!/usr/bin/env python3
"""Validação local, sem dependências externas, dos artefatos CKO."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent
LIBRARIES = ROOT / "02-bibliotecas"
PAGES = ROOT / "03-templates" / "paginas"
ALIASES = (
    ROOT / "03-templates" / "biblioteca-seringa.html",
    ROOT / "03-templates" / "seringa-10ml.html",
)
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
REQUIRED_LIBRARY_FIELDS = {
    "id",
    "name",
    "description",
    "category",
    "clinicalKnowledge",
    "patientSafety",
    "nursingIntelligence",
}


class DocumentAudit(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[str] = []
        self.has_main = False
        self.inline_handlers = 0
        self.inline_styles = 0
        self.external_references = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(str(values["id"]))
        if tag == "main" and values.get("id") == "conteudo":
            self.has_main = True
        for name, value in attrs:
            if name.startswith("on"):
                self.inline_handlers += 1
            if name == "style":
                self.inline_styles += 1
            if name in {"href", "src"} and value:
                self.references.append(value)
                if value.startswith(("http://", "https://", "//")):
                    self.external_references += 1


def load_json(path: Path, errors: list[str]):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"JSON inválido: {path.relative_to(ROOT)} — {exc}")
        return None


def validate_libraries(errors: list[str]) -> list[dict]:
    libraries = []
    for path in sorted(LIBRARIES.glob("*.json")):
        data = load_json(path, errors)
        if data is None or path.name.startswith("_"):
            continue
        if not isinstance(data, dict):
            errors.append(f"Biblioteca deve ser objeto: {path.name}")
            continue
        missing = sorted(REQUIRED_LIBRARY_FIELDS - set(data))
        if missing:
            errors.append(f"{path.name}: faltam {', '.join(missing)}")
            continue
        if not isinstance(data.get("id"), str) or not SLUG_RE.fullmatch(data["id"]):
            errors.append(f"{path.name}: id inválido: {data.get('id')!r}")
            continue
        libraries.append(data)
    return libraries


def validate_all_json(errors: list[str]) -> int:
    count = 0
    for path in sorted(ROOT.rglob("*.json")):
        count += 1
        load_json(path, errors)
    return count


def resolve_reference(page: Path, reference: str) -> Path | None:
    parsed = urlsplit(reference)
    if parsed.scheme or reference.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    clean = unquote(parsed.path)
    if not clean:
        return None
    return (page.parent / clean).resolve()


def audit_html(page: Path, errors: list[str]) -> None:
    source = page.read_text(encoding="utf-8")
    audit = DocumentAudit()
    audit.feed(source)
    page_name = str(page.relative_to(ROOT))
    duplicates = sorted({item for item in audit.ids if audit.ids.count(item) > 1})
    if duplicates:
        errors.append(f"{page_name}: IDs duplicados: {', '.join(duplicates)}")
    if not audit.has_main:
        errors.append(f"{page_name}: falta <main id=\"conteudo\">")
    if audit.inline_handlers:
        errors.append(f"{page_name}: {audit.inline_handlers} manipulador(es) inline")
    if audit.inline_styles:
        errors.append(f"{page_name}: {audit.inline_styles} estilo(s) inline")
    if audit.external_references:
        errors.append(f"{page_name}: {audit.external_references} dependência(s) externa(s)")
    for reference in audit.references:
        target = resolve_reference(page, reference)
        if target is None:
            continue
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{page_name}: referência sai de cko-projeto: {reference}")
            continue
        if not target.exists():
            errors.append(f"{page_name}: referência inexistente: {reference}")


def validate_pages(libraries: list[dict], errors: list[str]) -> tuple[int, int]:
    expected = {f"{item['id']}.html" for item in libraries} | {"index.html"}
    actual = {path.name for path in PAGES.glob("*.html")}
    for missing in sorted(expected - actual):
        errors.append(f"Página ausente: 03-templates/paginas/{missing}")
    for unexpected in sorted(actual - expected):
        errors.append(f"Página inesperada: 03-templates/paginas/{unexpected}")

    for page_name in sorted(expected & actual):
        audit_html(PAGES / page_name, errors)

    aliases_found = 0
    for alias in ALIASES:
        if not alias.exists():
            errors.append(f"Alias de compatibilidade ausente: {alias.relative_to(ROOT)}")
            continue
        aliases_found += 1
        audit_html(alias, errors)
    return len(actual), aliases_found


def main() -> int:
    errors: list[str] = []
    json_count = validate_all_json(errors)
    libraries = validate_libraries(errors)
    page_count, alias_count = validate_pages(libraries, errors)

    print("== Validação do Projeto CKO ==")
    print(f"JSONs analisados: {json_count}")
    print(f"Bibliotecas renderizáveis: {len(libraries)}")
    print(f"HTMLs na pasta de páginas: {page_count}")
    print(f"Aliases de compatibilidade: {alias_count}")
    if errors:
        print(f"\nFalhou com {len(errors)} problema(s):")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("\nOK — páginas autônomas, referências locais e estruturas básicas válidas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
