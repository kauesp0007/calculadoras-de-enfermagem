"""Auditor técnico do repositório — Fase 5.

Analisa SEO, performance, acessibilidade, duplicações, links quebrados,
organização e consistência. NUNCA modifica arquivos.
"""

from typing import List, Dict
from collections import defaultdict

from .config import BASE_DIR


def audit(
    files: List[Dict],
    stats: Dict,
    parsed_content: Dict[str, Dict],
    dep_map: Dict,
    nav_map: Dict,
) -> Dict:
    """Executa auditoria técnica completa.

    Returns:
        Dicionário com problemas, estatísticas, indicadores e recomendações.
    """
    findings = []
    indicators = {}
    recommendations = []

    # ── SEO ──────────────────────────────────────────────────────────
    _audit_seo(files, parsed_content, findings, indicators, recommendations)

    # ── Core Web Vitals / Performance ────────────────────────────────
    _audit_performance(files, parsed_content, findings, indicators, recommendations)

    # ── Acessibilidade ───────────────────────────────────────────────
    _audit_accessibility(files, parsed_content, findings, indicators, recommendations)

    # ── Integridade Estrutural ───────────────────────────────────────
    _audit_integrity(files, parsed_content, dep_map, nav_map, findings, indicators, recommendations)

    # ── Consistência entre idiomas ────────────────────────────────────
    _audit_language_consistency(files, parsed_content, findings, indicators, recommendations)

    # ── Organização ──────────────────────────────────────────────────
    _audit_organization(files, stats, findings, indicators, recommendations)

    return {
        "findings": findings,
        "indicators": indicators,
        "recommendations": recommendations,
        "total_findings": len(findings),
        "critical": len([f for f in findings if f["severity"] == "CRÍTICO"]),
        "high": len([f for f in findings if f["severity"] == "ALTO"]),
        "medium": len([f for f in findings if f["severity"] == "MÉDIO"]),
        "low": len([f for f in findings if f["severity"] == "BAIXO"]),
    }


def _add_finding(findings, severity, category, title, detail, recommendation=""):
    findings.append({
        "severity": severity,
        "category": category,
        "title": title,
        "detail": detail,
        "recommendation": recommendation,
    })


# ── SEO ───────────────────────────────────────────────────────────────

def _audit_seo(files, parsed, findings, indicators, recommendations):
    """Audita aspectos de SEO."""
    html_files = [f for f in files if f["type"] == "html"]

    missing_title = 0
    missing_description = 0
    missing_canonical = 0
    missing_hreflang = 0
    duplicate_titles = defaultdict(list)
    too_long_title = 0
    too_long_desc = 0

    for f in html_files:
        rel = str(f["relative_path"])
        p = parsed.get(rel, {})

        title = p.get("title", "")
        desc = p.get("description", "")
        canon = p.get("canonical", "")
        hreflangs = p.get("hreflangs", [])

        if not title:
            missing_title += 1
            _add_finding(findings, "ALTO", "SEO", f"Sem <title>: {rel}",
                         "Página sem tag <title>. Impacta SEO diretamente.",
                         "Adicionar <title> descritivo com palavra-chave principal.")

        if not desc:
            missing_description += 1

        if not canon:
            missing_canonical += 1

        if not hreflangs and rel.count("/") <= 1:
            missing_hreflang += 1

        if title:
            duplicate_titles[title].append(rel)
            if len(title) > 60:
                too_long_title += 1

        if desc and len(desc) > 160:
            too_long_desc += 1

    indicators["seo_missing_title"] = missing_title
    indicators["seo_missing_description"] = missing_description
    indicators["seo_missing_canonical"] = missing_canonical
    indicators["seo_too_long_title"] = too_long_title
    indicators["seo_too_long_desc"] = too_long_desc

    for title, pages in duplicate_titles.items():
        if len(pages) > 1:
            _add_finding(findings, "MÉDIO", "SEO",
                         f"Títulos duplicados: {title[:60]}",
                         f"{len(pages)} páginas com o mesmo <title>.",
                         "Diferenciar títulos para evitar canibalização.")


# ── Performance ───────────────────────────────────────────────────────

def _audit_performance(files, parsed, findings, indicators, recommendations):
    """Audita aspectos de performance (Core Web Vitals)."""
    html_files = [f for f in files if f["type"] == "html"]

    large_images = []
    for f in files:
        if f["type"] == "imagem" and f["size_bytes"] > 500_000:  # >500KB
            large_images.append(str(f["relative_path"]))

    if large_images:
        indicators["performance_large_images"] = len(large_images)
        _add_finding(findings, "MÉDIO", "Performance",
                     f"Imagens grandes (>500KB): {len(large_images)}",
                     "Imagens pesadas impactam LCP (Largest Contentful Paint).",
                     "Converter para WebP e usar srcset com tamanhos responsivos.")


# ── Acessibilidade ────────────────────────────────────────────────────

def _audit_accessibility(files, parsed, findings, indicators, recommendations):
    """Audita aspectos de acessibilidade."""
    total_missing_alt = 0
    pages_missing_h1 = 0
    pages_with_multiple_h1 = 0

    for rel_str, p in parsed.items():
        if p.get("_type") != "html":
            continue

        missing = p.get("img_alt_missing", 0)
        if missing > 0:
            total_missing_alt += missing

        h1_count = p.get("h1_count", 0)
        if h1_count == 0:
            pages_missing_h1 += 1
            _add_finding(findings, "MÉDIO", "Acessibilidade",
                         f"Sem <h1>: {rel_str}",
                         "Página sem heading principal.",
                         "Adicionar um <h1> descritivo.")
        elif h1_count > 1:
            pages_with_multiple_h1 += 1
            _add_finding(findings, "BAIXO", "Acessibilidade",
                         f"Múltiplos <h1>: {rel_str} ({h1_count}x)",
                         "Múltiplos h1 podem confundir leitores de tela.",
                         "Manter apenas um <h1> por página.")

    indicators["a11y_missing_alt"] = total_missing_alt
    indicators["a11y_missing_h1"] = pages_missing_h1
    indicators["a11y_multiple_h1"] = pages_with_multiple_h1


# ── Integridade ───────────────────────────────────────────────────────

def _audit_integrity(files, parsed, dep_map, nav_map, findings, indicators, recommendations):
    """Audita integridade estrutural."""
    broken = dep_map.get("broken_references", [])
    indicators["integrity_broken_refs"] = len(broken)

    if broken:
        _add_finding(findings, "ALTO", "Integridade",
                     f"Referências quebradas: {len(broken)}",
                     "Arquivos referenciados que não existem no repositório.",
                     "Corrigir ou remover as referências listadas no mapa de dependências.")

    orphans = nav_map.get("orphan_pages", [])
    indicators["integrity_orphan_pages"] = len(orphans)

    if orphans:
        _add_finding(findings, "BAIXO", "Integridade",
                     f"Páginas órfãs: {len(orphans)}",
                     "Páginas sem links de entrada de outras páginas.",
                     "Adicionar links para estas páginas no menu ou em páginas relacionadas.")


# ── Consistência entre idiomas ────────────────────────────────────────

def _audit_language_consistency(files, parsed, findings, indicators, recommendations):
    """Audita consistência entre versões de idioma."""
    html_files = [f for f in files if f["type"] == "html"]

    # Agrupa por nome de arquivo
    by_name = defaultdict(list)
    for f in html_files:
        by_name[f["name"]].append(f)

    # Verifica quantas páginas PT têm equivalentes em outros idiomas
    pt_pages = [f for f in html_files if f["language"] == "pt" and "/" not in str(f["relative_path"])]
    total_pt = len(pt_pages)
    with_translations = 0

    for pt in pt_pages:
        name = pt["name"]
        translations = [
            f for f in html_files
            if f["name"] == name and f["language"] and f["language"] != "pt"
        ]
        if translations:
            with_translations += 1

    indicators["i18n_total_pt_root"] = total_pt
    indicators["i18n_with_translations"] = with_translations
    indicators["i18n_coverage_pct"] = round(with_translations / max(1, total_pt) * 100, 1)

    if total_pt > 0 and with_translations < total_pt:
        _add_finding(findings, "MÉDIO", "Consistência",
                     f"Cobertura de tradução: {with_translations}/{total_pt} ({indicators['i18n_coverage_pct']}%)",
                     "Nem todas as páginas possuem versões traduzidas.",
                     "Criar versões traduzidas para as páginas faltantes.")


# ── Organização ────────────────────────────────────────────────────────

def _audit_organization(files, stats, findings, indicators, recommendations):
    """Audita organização das pastas e tipos de arquivo."""
    # Arquivos na raiz que deveriam estar em pastas
    root_files = [f for f in files if len(f["relative_path"].parts) == 1]
    root_by_type = defaultdict(list)
    for f in root_files:
        root_by_type[f["type"]].append(f["name"])

    indicators["org_root_files"] = len(root_files)
    indicators["org_root_html"] = len(root_by_type.get("html", []))
    indicators["org_root_js"] = len(root_by_type.get("js", []))
    indicators["org_root_json"] = len(root_by_type.get("json", []))

    # Poucos arquivos JS/JSON na raiz podem indicar boa organização
    # Muitos podem indicar necessidade de mover para /js/

    # Arquivos grandes que deveriam ser otimizados
    large_files = sorted(
        [f for f in files if f["size_bytes"] > 1_000_000],  # >1MB
        key=lambda x: x["size_bytes"], reverse=True
    )[:10]
    if large_files:
        indicators["org_large_files"] = [{
            "path": str(f["relative_path"]),
            "size": f["size_bytes"]
        } for f in large_files]


# ── Geradores ──────────────────────────────────────────────────────────

def generate_txt(audit_result: Dict) -> str:
    """Gera relatório de auditoria em texto."""
    lines = []
    lines.append("=" * 72)
    lines.append("  AUDITORIA TÉCNICA DO REPOSITÓRIO")
    lines.append("=" * 72)
    lines.append("")

    # Resumo
    lines.append(f"Total de problemas: {audit_result['total_findings']}")
    lines.append(f"  CRÍTICO: {audit_result['critical']}")
    lines.append(f"  ALTO:    {audit_result['high']}")
    lines.append(f"  MÉDIO:   {audit_result['medium']}")
    lines.append(f"  BAIXO:   {audit_result['low']}")
    lines.append("")

    # Problemas por severidade
    for severity in ["CRÍTICO", "ALTO", "MÉDIO", "BAIXO"]:
        sev_findings = [f for f in audit_result["findings"] if f["severity"] == severity]
        if not sev_findings:
            continue
        lines.append("─" * 72)
        lines.append(f"  [{severity}] — {len(sev_findings)} problema(s)")
        lines.append("─" * 72)
        for i, f in enumerate(sev_findings, 1):
            lines.append(f"  #{i} [{f['category']}] {f['title']}")
            lines.append(f"      {f['detail']}")
            if f.get("recommendation"):
                lines.append(f"      Recomendação: {f['recommendation']}")
            lines.append("")

    # Indicadores
    lines.append("─" * 72)
    lines.append("  INDICADORES")
    lines.append("─" * 72)
    for k, v in sorted(audit_result["indicators"].items()):
        if isinstance(v, (list, dict)):
            v_display = f"[{len(v)} itens]"
        else:
            v_display = str(v)
        lines.append(f"  {k}: {v_display}")

    lines.append("")
    return "\n".join(lines)


def generate_md(audit_result: Dict) -> str:
    """Gera relatório de auditoria em Markdown."""
    lines = []
    lines.append("# 🔍 Auditoria Técnica do Repositório")
    lines.append("")

    lines.append("## 📊 Resumo")
    lines.append("")
    lines.append("| Severidade | Quantidade |")
    lines.append("|---|---|")
    lines.append(f"| 🔴 CRÍTICO | **{audit_result['critical']}** |")
    lines.append(f"| 🟠 ALTO | **{audit_result['high']}** |")
    lines.append(f"| 🟡 MÉDIO | **{audit_result['medium']}** |")
    lines.append(f"| 🟢 BAIXO | **{audit_result['low']}** |")
    lines.append(f"| **Total** | **{audit_result['total_findings']}** |")
    lines.append("")

    for severity, icon in [("CRÍTICO", "🔴"), ("ALTO", "🟠"), ("MÉDIO", "🟡"), ("BAIXO", "🟢")]:
        sev_findings = [f for f in audit_result["findings"] if f["severity"] == severity]
        if not sev_findings:
            continue
        lines.append(f"## {icon} {severity} ({len(sev_findings)})")
        lines.append("")
        for f in sev_findings:
            lines.append(f"### [{f['category']}] {f['title']}")
            lines.append("")
            lines.append(f"{f['detail']}")
            if f.get("recommendation"):
                lines.append("")
                lines.append(f"**Recomendação:** {f['recommendation']}")
            lines.append("")

    lines.append("## 📈 Indicadores")
    lines.append("")
    lines.append("| Indicador | Valor |")
    lines.append("|---|---|")
    for k, v in sorted(audit_result["indicators"].items()):
        if isinstance(v, (list, dict)):
            v_display = f"[{len(v)} itens]"
        else:
            v_display = str(v)
        lines.append(f"| {k} | {v_display} |")
    lines.append("")

    return "\n".join(lines)
