"""Gerador de relatórios TXT e Markdown.

Recebe as estatísticas e a árvore e gera dois arquivos de saída:
- CATALOGO_DO_REPOSITORIO.txt (texto puro)
- CATALOGO_DO_REPOSITORIO.md (Markdown formatado)
"""

from datetime import datetime
from typing import List, Dict

from .config import TXT_OUTPUT, MD_OUTPUT, BASE_DIR


def _format_size(size_bytes: int) -> str:
    """Formata bytes em uma unidade legível."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def _generate_txt(stats: Dict, tree: str) -> str:
    """Gera o conteúdo do relatório em texto puro."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    lines = []

    # ── Cabeçalho ────────────────────────────────────────────────────
    lines.append("=" * 72)
    lines.append("  CATÁLOGO DO REPOSITÓRIO")
    lines.append("  Calculadoras de Enfermagem")
    lines.append(f"  Gerado em: {now}")
    lines.append("  Fase 1 — Apenas Leitura")
    lines.append("=" * 72)
    lines.append("")

    # ── Resumo Geral ─────────────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  RESUMO GERAL")
    lines.append("─" * 72)
    lines.append(f"  Total de arquivos ............ {stats['total_files']:,}")
    lines.append(f"  Total de pastas .............. {stats['total_dirs']:,}")
    lines.append(f"  Tamanho total ................ {_format_size(stats['total_size_bytes'])}")
    lines.append(f"  Extensões diferentes ......... {stats['total_extensions']}")
    lines.append("")

    # ── Por Tipo ─────────────────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  QUANTIDADE POR TIPO")
    lines.append("─" * 72)
    type_labels = {
        "html": "HTML",
        "css": "CSS",
        "js": "JavaScript",
        "json": "JSON",
        "imagem": "Imagens",
        "video": "Vídeos",
        "documento": "Documentos",
        "fonte": "Fontes",
        "sistema": "Sistema/Ferramentas",
        "outros": "Outros",
    }
    for item in stats["by_type"]:
        label = type_labels.get(item["type"], item["type"].capitalize())
        bar = "█" * min(int(item["count"] / max(1, stats["total_files"]) * 40), 40)
        lines.append(
            f"  {label:<25} {item['count']:>6,}  "
            f"({_format_size(item['size_bytes']):>10})  {bar}"
        )
    lines.append("")

    # ── Por Extensão ─────────────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  QUANTIDADE POR EXTENSÃO (TOP 20)")
    lines.append("─" * 72)
    for item in stats["by_extension"][:20]:
        ext_display = item["ext"] if item["ext"] != "(sem extensão)" else "s/ext"
        lines.append(
            f"  {ext_display:<12} {item['count']:>6,} arquivos  "
            f"({_format_size(item['size_bytes']):>10})"
        )
    lines.append("")

    # ── Por Idioma ───────────────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  HTML POR IDIOMA")
    lines.append("─" * 72)
    lang_labels = {
        "pt": "Português", "en": "Inglês", "es": "Espanhol",
        "de": "Alemão", "it": "Italiano", "fr": "Francês",
        "hi": "Hindi", "zh": "Chinês", "ar": "Árabe",
        "ja": "Japonês", "ru": "Russo", "ko": "Coreano",
        "tr": "Turco", "nl": "Holandês", "pl": "Polonês",
        "sv": "Sueco", "id": "Indonésio", "vi": "Vietnamita",
        "uk": "Ucraniano",
    }
    for item in stats["html_by_language"]:
        label = lang_labels.get(item["language"], item["language"])
        bar = "▓" * min(item["count"] // 2, 30)
        lines.append(f"  {label:<15} {item['count']:>5,} HTML  {bar}")
    lines.append(f"  Total de idiomas: {stats['total_languages']}")
    lines.append("")

    # ── HTML por localização ─────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  HTML POR LOCALIZAÇÃO")
    lines.append("─" * 72)
    lines.append(f"  Na raiz (português) .......... {stats['html_root']:,}")
    lines.append(f"  Em pastas de idioma ........... {stats['html_in_lang_folders']:,}")
    lines.append(f"  No blog ....................... {stats['html_blog']:,}")
    lines.append(f"  Em conta ...................... {stats['html_conta']:,}")
    lines.append("")

    # ── Páginas multilíngues ────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  PÁGINAS MULTILÍNGUES")
    lines.append("─" * 72)
    if stats["multilingual_pages"]:
        for item in stats["multilingual_pages"]:
            langs_display = ", ".join(item["languages"])
            lines.append(f"  {item['page']:<45} [{langs_display}]")
    else:
        lines.append("  (nenhuma página em múltiplos idiomas)")
    lines.append("")

    # ── Por pasta especial ──────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  ARQUIVOS POR PASTA ESPECIAL")
    lines.append("─" * 72)
    for item in stats["by_special_dir"]:
        lines.append(f"  {item['dir']:<20} {item['count']:>6,} arquivos")
    lines.append("")

    # ── Árvore de pastas ─────────────────────────────────────────────
    lines.append("─" * 72)
    lines.append("  ÁRVORE DE PASTAS")
    lines.append("─" * 72)
    lines.append(tree)
    lines.append("")

    # ── Rodapé ───────────────────────────────────────────────────────
    lines.append("=" * 72)
    lines.append("  Fim do catálogo.")
    lines.append("  Repository Catalog Engine v1.0 — Fase 1 (Leitura)")
    lines.append("=" * 72)

    return "\n".join(lines)


def _generate_md(stats: Dict, tree: str) -> str:
    """Gera o conteúdo do relatório em Markdown."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    lines = []

    lines.append("# 📦 Catálogo do Repositório")
    lines.append("")
    lines.append("**Projeto:** Calculadoras de Enfermagem  ")
    lines.append(f"**Gerado em:** {now}  ")
    lines.append("**Fase:** 1 — Apenas Leitura  ")
    lines.append("")

    # ── Resumo ───────────────────────────────────────────────────────
    lines.append("## 📊 Resumo Geral")
    lines.append("")
    lines.append("| Métrica | Valor |")
    lines.append("|---|---|")
    lines.append(f"| Total de arquivos | **{stats['total_files']:,}** |")
    lines.append(f"| Total de pastas | **{stats['total_dirs']:,}** |")
    lines.append(f"| Tamanho total | **{_format_size(stats['total_size_bytes'])}** |")
    lines.append(f"| Extensões diferentes | **{stats['total_extensions']}** |")
    lines.append("")

    # ── Por tipo ─────────────────────────────────────────────────────
    lines.append("## 🗂️ Quantidade por Tipo")
    lines.append("")
    lines.append("| Tipo | Quantidade | Tamanho |")
    lines.append("|---|---|---|")
    type_labels = {
        "html": "HTML", "css": "CSS", "js": "JavaScript",
        "json": "JSON", "imagem": "Imagens", "video": "Vídeos",
        "documento": "Documentos", "fonte": "Fontes",
        "sistema": "Sistema", "outros": "Outros",
    }
    for item in stats["by_type"]:
        label = type_labels.get(item["type"], item["type"])
        lines.append(
            f"| {label} | **{item['count']:,}** | "
            f"{_format_size(item['size_bytes'])} |"
        )
    lines.append("")

    # ── Top extensões ────────────────────────────────────────────────
    lines.append("## 📎 Top 20 Extensões")
    lines.append("")
    lines.append("| Extensão | Arquivos | Tamanho |")
    lines.append("|---|---|---|")
    for item in stats["by_extension"][:20]:
        ext_display = f"`{item['ext']}`" if item["ext"] != "(sem extensão)" else "s/ext"
        lines.append(
            f"| {ext_display} | {item['count']:,} | "
            f"{_format_size(item['size_bytes'])} |"
        )
    lines.append("")

    # ── Por idioma ──────────────────────────────────────────────────
    lines.append("## 🌐 HTML por Idioma")
    lines.append("")
    lines.append("| Idioma | Arquivos HTML |")
    lines.append("|---|---|")
    lang_labels = {
        "pt": "🇧🇷 Português", "en": "🇺🇸 Inglês", "es": "🇪🇸 Espanhol",
        "de": "🇩🇪 Alemão", "it": "🇮🇹 Italiano", "fr": "🇫🇷 Francês",
        "hi": "🇮🇳 Hindi", "zh": "🇨🇳 Chinês", "ar": "🇸🇦 Árabe",
        "ja": "🇯🇵 Japonês", "ru": "🇷🇺 Russo", "ko": "🇰🇷 Coreano",
        "tr": "🇹🇷 Turco", "nl": "🇳🇱 Holandês", "pl": "🇵🇱 Polonês",
        "sv": "🇸🇪 Sueco", "id": "🇮🇩 Indonésio", "vi": "🇻🇳 Vietnamita",
        "uk": "🇺🇦 Ucraniano",
    }
    for item in stats["html_by_language"]:
        label = lang_labels.get(item["language"], item["language"])
        lines.append(f"| {label} | **{item['count']:,}** |")
    lines.append("")
    lines.append(f"**Total de idiomas:** {stats['total_languages']}")
    lines.append("")

    # ── Localização ─────────────────────────────────────────────────
    lines.append("## 📍 HTML por Localização")
    lines.append("")
    lines.append("| Localização | Quantidade |")
    lines.append("|---|---|")
    lines.append(f"| Raiz (português) | **{stats['html_root']:,}** |")
    lines.append(f"| Pastas de idioma | **{stats['html_in_lang_folders']:,}** |")
    lines.append(f"| Blog | **{stats['html_blog']:,}** |")
    lines.append(f"| Conta | **{stats['html_conta']:,}** |")
    lines.append("")

    # ── Multilíngues ────────────────────────────────────────────────
    lines.append("## 🔗 Páginas Multilíngues")
    lines.append("")
    if stats["multilingual_pages"]:
        lines.append("| Página | Idiomas |")
        lines.append("|---|---|")
        for item in stats["multilingual_pages"]:
            langs_display = ", ".join(item["languages"])
            lines.append(f"| `{item['page']}` | {langs_display} |")
    else:
        lines.append("*(nenhuma página em múltiplos idiomas)*")
    lines.append("")

    # ── Pastas especiais ────────────────────────────────────────────
    lines.append("## 📁 Arquivos por Pasta Especial")
    lines.append("")
    lines.append("| Pasta | Arquivos |")
    lines.append("|---|---|")
    for item in stats["by_special_dir"]:
        lines.append(f"| {item['dir']} | **{item['count']:,}** |")
    lines.append("")

    # ── Árvore ──────────────────────────────────────────────────────
    lines.append("## 🌳 Árvore de Pastas")
    lines.append("")
    lines.append("```")
    lines.append(tree)
    lines.append("```")
    lines.append("")

    # ── Rodapé ──────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("*Repository Catalog Engine v1.0 — Fase 1 (Leitura)*  ")
    lines.append(f"*Gerado em {now}*")

    return "\n".join(lines)


def generate(stats: Dict, tree: str) -> None:
    """Gera ambos os arquivos de saída (TXT e MD).

    Args:
        stats: Estatísticas computadas pelo analyzer.
        tree: Árvore de diretórios gerada pelo tree_builder.
    """
    # TXT
    txt_content = _generate_txt(stats, tree)
    TXT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TXT_OUTPUT.write_text(txt_content, encoding="utf-8")
    print(f"[OK] TXT gerado: {TXT_OUTPUT}")

    # MD
    md_content = _generate_md(stats, tree)
    MD_OUTPUT.write_text(md_content, encoding="utf-8")
    print(f"[OK] MD  gerado: {MD_OUTPUT}")
