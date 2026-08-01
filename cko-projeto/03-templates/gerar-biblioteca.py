#!/usr/bin/env python3
"""Gera páginas HTML autônomas a partir das bibliotecas CKO.

As páginas geradas dependem somente dos arquivos existentes em ``cko-projeto``:

* ``css/pages/biblioteca.css``
* ``cko-page.js``

Uso:
    python gerar-biblioteca.py ../02-bibliotecas/curativos.json ./paginas
    python gerar-biblioteca.py --all ../02-bibliotecas ./paginas
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_LIBRARY_FIELDS = {
    "id",
    "name",
    "description",
    "category",
    "clinicalKnowledge",
    "patientSafety",
    "nursingIntelligence",
}
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def e(value: Any) -> str:
    """Escapa qualquer valor antes de inseri-lo no HTML."""
    return html.escape(str(value), quote=True)


def label(key: Any) -> str:
    text = re.sub(r"([a-zà-ÿ0-9])([A-Z])", r"\1 \2", str(key))
    text = text.replace("_", " ").replace("-", " ").strip()
    return text[:1].upper() + text[1:]


def present(value: Any) -> bool:
    return value not in (None, "", [], {})


def render_value(value: Any, depth: int = 0) -> str:
    """Renderiza valores JSON sem expor JSON bruto na página."""
    if not present(value):
        return '<span class="empty-value">Não informado</span>'
    if isinstance(value, bool):
        return '<span class="status-value">Sim</span>' if value else '<span class="status-value">Não</span>'
    if isinstance(value, list):
        items = "".join(f"<li>{render_value(item, depth + 1)}</li>" for item in value if present(item))
        return f'<ul class="clean">{items}</ul>' if items else '<span class="empty-value">Não informado</span>'
    if isinstance(value, dict):
        rows = []
        for key, item in value.items():
            if not present(item):
                continue
            rendered = render_value(item, depth + 1)
            rows.append(f"<tr><th scope=\"row\">{e(label(key))}</th><td>{rendered}</td></tr>")
        if not rows:
            return '<span class="empty-value">Não informado</span>'
        return '<div class="table-scroll"><table class="data"><tbody>' + "".join(rows) + "</tbody></table></div>"
    return e(value)


def render_section(title: str, value: Any, *, css_class: str = "") -> str:
    if not present(value):
        return ""
    class_attr = f' {css_class}' if css_class else ""
    return f'<section class="content-section{class_attr}"><h3>{e(title)}</h3>{render_value(value)}</section>'


def render_characteristics(data: dict[str, Any]) -> str:
    modules = data.get("exclusiveModules") or []
    characteristics = data.get("characteristics") or {}
    sections = []
    for module in modules:
        value = characteristics.get(module)
        if present(value):
            sections.append(render_section(label(module), value))
    return "".join(sections) or '<p class="empty-value">Sem características específicas cadastradas.</p>'


def render_specs(data: dict[str, Any]) -> str:
    specifications = ((data.get("catalog") or {}).get("specifications") or {})
    extensions = data.get("extensions") or {}
    merged = {**specifications, **extensions}
    return render_section("Ficha técnica", merged)


def render_indications(items: list[Any]) -> str:
    if not items:
        return '<p class="empty-value">Nenhuma indicação cadastrada.</p>'
    output = []
    for item in items:
        if isinstance(item, dict):
            condition = item.get("condition") or item.get("name") or "Indicação"
            rationale = item.get("rationale") or item.get("description") or ""
            output.append(
                f'<article class="info-item"><strong>{e(condition)}</strong>'
                + (f"<p>{e(rationale)}</p>" if rationale else "")
                + "</article>"
            )
        else:
            output.append(f'<article class="info-item">{e(item)}</article>')
    return "".join(output)


def render_contraindications(items: list[Any]) -> str:
    if not items:
        return '<p class="empty-value">Nenhuma contraindicação cadastrada.</p>'
    output = []
    for item in items:
        if isinstance(item, dict):
            condition = item.get("condition") or item.get("name") or "Contraindicação"
            risk = item.get("risk") or item.get("rationale") or ""
        else:
            condition, risk = item, ""
        output.append(
            f'<article class="alert-item"><span aria-hidden="true">⚠</span><div><strong>{e(condition)}</strong>'
            + (f"<p>{e(risk)}</p>" if risk else "")
            + "</div></article>"
        )
    return "".join(output)


def render_resources(data: dict[str, Any]) -> str:
    resources = ((data.get("catalog") or {}).get("technicalDocs") or [])
    if isinstance(resources, str):
        resources = [resources]
    if not resources:
        return '<p class="empty-value">Nenhum arquivo complementar cadastrado.</p>'
    # Os arquivos declarados atualmente não fazem parte de cko-projeto. Mantemos a
    # informação editorial sem criar links quebrados.
    return '<ul class="resource-list">' + "".join(
        f'<li><span aria-hidden="true">📄</span> {e(Path(str(resource)).name)}'
        '<span class="resource-status">Arquivo ainda não incluído neste projeto</span></li>'
        for resource in resources
    ) + "</ul>"


def render_risk(data: dict[str, Any]) -> str:
    if not data:
        return ""
    chips = []
    if present(data.get("level")):
        level = data["level"]
        tone = "danger" if str(level).lower() in {"alto", "crítico", "critico"} else "success"
        chips.append(f'<span class="chip chip-{tone}">Risco {e(level)}</span>')
    for name, key in (("ANVISA", "anvisaClass"), ("FDA", "fdaClass"), ("UE", "euClass")):
        if present(data.get(key)):
            chips.append(f'<span class="chip chip-info">{name}: {e(data[key])}</span>')
    rationale = f'<p class="muted">{e(data.get("rationale"))}</p>' if present(data.get("rationale")) else ""
    return '<div class="risk-summary">' + "".join(chips) + rationale + "</div>"


def taxonomies(data: dict[str, Any]) -> str:
    nursing_process = ((data.get("nursingIntelligence") or {}).get("nursingProcess") or {})
    blocks = []
    for title, key, code_key in (
        ("Diagnósticos NANDA-I", "diagnosis", "nanda"),
        ("Intervenções NIC", "interventions", "nic"),
        ("Resultados NOC", "outcomes", "noc"),
    ):
        items = nursing_process.get(key) or []
        formatted = []
        for item in items:
            if isinstance(item, dict):
                text = item.get("label") or item.get("name") or "Item"
                code = item.get(code_key) or item.get("code") or ""
                formatted.append(f"{e(text)}" + (f" <span class=\"taxonomy-code\">{e(code)}</span>" if code else ""))
            else:
                formatted.append(e(item))
        content = '<ul class="clean">' + "".join(f"<li>{item}</li>" for item in formatted) + "</ul>" if formatted else '<p class="empty-value">Não informado.</p>'
        blocks.append(f'<section class="content-section"><h3>{title}</h3>{content}</section>')
    return "".join(blocks)


def tab_button(tab_id: str, title: str, active: bool = False) -> str:
    selected = "true" if active else "false"
    tabindex = "0" if active else "-1"
    active_class = " active" if active else ""
    return (
        f'<button class="tab-btn{active_class}" id="tab-btn-{tab_id}" role="tab" '
        f'aria-selected="{selected}" aria-controls="tab-{tab_id}" tabindex="{tabindex}" '
        f'data-tab="{tab_id}">{e(title)}</button>'
    )


def tab_panel(tab_id: str, body: str, active: bool = False) -> str:
    active_class = " active" if active else ""
    hidden = "" if active else " hidden"
    return (
        f'<section class="tab-content{active_class}" id="tab-{tab_id}" role="tabpanel" '
        f'aria-labelledby="tab-btn-{tab_id}"{hidden}>{body}</section>'
    )


def validate_library(data: Any, source: Path) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError(f"{source.name}: a raiz do JSON deve ser um objeto")
    missing = sorted(REQUIRED_LIBRARY_FIELDS - set(data))
    if missing:
        raise ValueError(f"{source.name}: campos obrigatórios ausentes: {', '.join(missing)}")
    slug = data.get("id")
    if not isinstance(slug, str) or not SLUG_RE.fullmatch(slug):
        raise ValueError(f"{source.name}: id inválido para nome de arquivo: {slug!r}")
    if not isinstance(data.get("clinicalKnowledge"), dict):
        raise ValueError(f"{source.name}: clinicalKnowledge deve ser um objeto")
    return data


def load_library(source: Path) -> dict[str, Any]:
    try:
        data = json.loads(source.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{source.name}: JSON inválido: {exc}") from exc
    return validate_library(data, source)


def render_page(data: dict[str, Any]) -> str:
    name = data.get("name", "")
    icon = data.get("icon") or "📘"
    description = data.get("description", "")
    category = data.get("category", "")
    subcategory = data.get("subcategory", "")
    slug = data["id"]
    clinical = data.get("clinicalKnowledge") or {}
    patient_safety = data.get("patientSafety") or {}
    risk = data.get("risk") or {}

    purpose = clinical.get("clinicalPurpose") or {}
    overview = ""
    if isinstance(purpose, dict):
        overview += render_section("Finalidade principal", purpose.get("primary"))
        overview += render_section("Finalidades secundárias", purpose.get("secondary"))
    else:
        overview += render_section("Finalidade clínica", purpose)
    overview += render_section("Termos e classificação semântica", data.get("semantic"))
    overview += render_section("Tags", data.get("tags"))

    characteristics = render_specs(data) + render_risk(risk) + render_characteristics(data)
    indications = render_indications(clinical.get("indications") or [])
    contraindications = render_contraindications(clinical.get("contraindications") or [])

    safety = ""
    flags = []
    if patient_safety.get("highRisk"):
        flags.append('<span class="chip chip-danger">Alto risco</span>')
    if patient_safety.get("doubleCheckRequired"):
        flags.append('<span class="chip chip-warning">Dupla checagem</span>')
    if flags:
        safety += '<div class="risk-summary">' + "".join(flags) + "</div>"
    safety += render_section("Nunca-eventos", patient_safety.get("neverEvents"), css_class="danger-section")
    safety += render_section("Alertas", patient_safety.get("alerts"), css_class="danger-section")
    safety += render_section("Riscos clínicos", clinical.get("clinicalRisks"))
    safety += render_section("Regras clínicas", clinical.get("clinicalRules"))
    safety += render_section("Cálculos clínicos", clinical.get("calculations"))
    if not safety:
        safety = '<p class="empty-value">Sem informações adicionais de segurança.</p>'

    evidence = render_section("Evidência declarada", clinical.get("evidence"), css_class="evidence-section")
    evidence += render_section("Regulatório", data.get("regulatory"))
    evidence += render_section("Auditoria", data.get("auditTrail"))
    evidence += f'<section class="content-section"><h3>Recursos</h3>{render_resources(data)}</section>'

    metadata_sections = []
    for title, key in (
        ("Inteligência decisória", "decisionIntelligence"),
        ("Comparação", "comparisonEngine"),
        ("Educação", "education"),
        ("Sustentabilidade", "sustainability"),
        ("Integração de workflow", "workflowIntegration"),
        ("Metadados de IA", "aiMetadata"),
        ("Inteligência comercial", "commercialIntelligence"),
        ("Localização", "localization"),
        ("Identidade de conhecimento", "knowledgeIdentity"),
    ):
        section = render_section(title, data.get(key))
        if section:
            metadata_sections.append(section)
    metadata = "".join(metadata_sections) or '<p class="empty-value">Sem metadados complementares.</p>'

    ld_json = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": name,
            "description": description,
            "inLanguage": "pt-BR",
            "isAccessibleForFree": True,
            "about": {"@type": "MedicalEntity", "name": name},
        },
        ensure_ascii=False,
    ).replace("</", "<\\/")

    buttons = "".join(
        tab_button(tab_id, title, active=index == 0)
        for index, (tab_id, title) in enumerate(
            (
                ("visao", "Visão geral"),
                ("caracteristicas", "Características"),
                ("indicacoes", "Indicações"),
                ("contraindicacoes", "Contraindicações"),
                ("seguranca", "Segurança"),
                ("processo", "NANDA/NIC/NOC"),
                ("evidencia", "Evidência"),
                ("metadados", "Dados complementares"),
            )
        )
    )
    panels = "".join(
        (
            tab_panel("visao", overview, True),
            tab_panel("caracteristicas", characteristics),
            tab_panel("indicacoes", indications),
            tab_panel("contraindicacoes", contraindications),
            tab_panel("seguranca", safety),
            tab_panel("processo", taxonomies(data)),
            tab_panel("evidencia", evidence),
            tab_panel("metadados", metadata),
        )
    )

    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-draft="true" data-content-id="{e(slug)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>{e(name)} | Biblioteca CKO</title>
  <meta name="description" content="{e(description)}">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="../css/pages/biblioteca.css">
  <script type="application/ld+json">{ld_json}</script>
  <script src="../cko-page.js" defer></script>
</head>
<body>
  <a href="#conteudo" class="skip-link">Pular para o conteúdo</a>
  <div id="statusMessage" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="draft-banner">PRÉVIA CKO — conteúdo pendente de revisão clínica; não publicar.</div>
  <header class="cko-site-header">
    <a class="cko-brand" href="index.html"><span aria-hidden="true">⚕</span><span>Bibliotecas CKO</span></a>
    <span class="header-note">Ambiente autônomo de validação</span>
  </header>
  <main id="conteudo" class="page-wrap">
    <nav class="breadcrumb" aria-label="Trilha de navegação"><ol>
      <li><a href="index.html">Bibliotecas</a></li>
      <li>{e(category)}</li>
      <li aria-current="page">{e(name)}</li>
    </ol></nav>

    <section class="cko-hero">
      <div class="hero-chips"><span class="chip">{e(category)}</span>{f'<span class="chip">{e(subcategory)}</span>' if subcategory else ''}</div>
      <h1><span aria-hidden="true">{e(icon)}</span> {e(name)}</h1>
      <p>{e(description)}</p>
      <dl class="facts">
        <div><dt>Categoria</dt><dd>{e(category or 'Não informada')}</dd></div>
        <div><dt>Subcategoria</dt><dd>{e(subcategory or 'Não informada')}</dd></div>
        <div><dt>Risco</dt><dd>{e(risk.get('level') or 'Não informado')}</dd></div>
        <div><dt>Classe ANVISA</dt><dd>{e(risk.get('anvisaClass') or 'Não informada')}</dd></div>
      </dl>
    </section>

    <div class="action-bar" aria-label="Ações da página">
      <button type="button" data-action="favorite" aria-pressed="false"><span aria-hidden="true">☆</span> Favoritar</button>
      <button type="button" data-action="share"><span aria-hidden="true">↗</span> Compartilhar</button>
      <button type="button" data-action="print"><span aria-hidden="true">⎙</span> Imprimir/PDF</button>
      <button type="button" data-action="report"><span aria-hidden="true">⚑</span> Reportar</button>
    </div>

    <article class="cko-card">
      <div class="cko-tabs" role="tablist" aria-label="Conteúdo de {e(name)}">{buttons}</div>
      {panels}
    </article>

    <aside class="clinical-disclaimer" role="note">
      <strong>Aviso clínico:</strong> conteúdo educacional em revisão. Não substitui protocolos institucionais, avaliação profissional nem julgamento clínico.
    </aside>
  </main>
  <footer class="cko-footer">
    <p>Projeto CKO · prévia local das bibliotecas clínicas</p>
  </footer>
</body>
</html>
"""


def render_index(libraries: list[dict[str, Any]]) -> str:
    cards = "".join(
        f'''<li><a class="library-card" href="{e(item['id'])}.html">
          <span class="library-icon" aria-hidden="true">{e(item.get('icon') or '📘')}</span>
          <span><strong>{e(item.get('name'))}</strong><small>{e(item.get('category') or 'Sem categoria')}</small><span>{e(item.get('description') or '')}</span></span>
        </a></li>'''
        for item in sorted(libraries, key=lambda row: str(row.get("name", "")).casefold())
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Bibliotecas CKO | Índice local</title>
  <meta name="description" content="Índice local das bibliotecas clínicas do Projeto CKO.">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="../css/pages/biblioteca.css">
  <script src="../cko-page.js" defer></script>
</head>
<body>
  <a href="#conteudo" class="skip-link">Pular para o conteúdo</a>
  <div id="statusMessage" class="sr-only" role="status" aria-live="polite"></div>
  <header class="cko-site-header"><span class="cko-brand"><span aria-hidden="true">⚕</span><span>Bibliotecas CKO</span></span><span class="header-note">{len(libraries)} bibliotecas disponíveis</span></header>
  <main id="conteudo" class="catalog-wrap">
    <section class="catalog-hero"><p class="eyebrow">Projeto CKO</p><h1>Bibliotecas clínicas</h1><p>Selecione uma biblioteca para revisar seu conteúdo estruturado. Estas páginas são prévias locais e permanecem fora do índice de buscadores.</p></section>
    <ul class="library-grid">{cards}</ul>
  </main>
  <footer class="cko-footer"><p>Projeto CKO · índice local</p></footer>
</body>
</html>
"""


def write_page(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def generate_one(source: Path, output_dir: Path) -> dict[str, Any]:
    library = load_library(source)
    destination = output_dir / f"{library['id']}.html"
    write_page(destination, render_page(library))
    print(f"gerado: {destination.name}")
    return library


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gera páginas autônomas das bibliotecas CKO")
    parser.add_argument("source", type=Path, help="JSON de origem ou diretório com --all")
    parser.add_argument("output", nargs="?", type=Path, default=Path("."), help="diretório de saída")
    parser.add_argument("--all", action="store_true", help="gera todos os JSONs de biblioteca, ignorando arquivos iniciados por _")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.all:
            if not args.source.is_dir():
                raise ValueError(f"diretório não encontrado: {args.source}")
            sources = sorted(path for path in args.source.glob("*.json") if not path.name.startswith("_"))
            if not sources:
                raise ValueError(f"nenhuma biblioteca encontrada em {args.source}")
            libraries = [generate_one(source, args.output) for source in sources]
            write_page(args.output / "index.html", render_index(libraries))
            print(f"gerado: index.html ({len(libraries)} bibliotecas)")
        else:
            generate_one(args.source, args.output)
    except (OSError, ValueError, KeyError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
