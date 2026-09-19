# -*- coding: utf-8 -*-
"""
Injeta o anúncio display horizontal (PÓS-BOTÃO / PRÉ-RESULTADO) imediatamente
ANTES de <div id="resultado-section"> (ou <section id="resultado-section">)
em todos os HTMLs da raiz e das 18 pastas de idiomas, exceto pastas/arquivos
proibidos.

Preserva o line ending original de cada arquivo (LF ou CRLF), evitando diffs
espúrios no Git.

Uso:
  python injetar-anuncio-pre-resultado.py --dry-run   # apenas relatório
  python injetar-anuncio-pre-resultado.py             # aplica de fato
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru",
         "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

# Pastas proibidas (não injetar)
FORBIDDEN_DIRS = {"downloads", "biblioteca", "blog", "blog-templates"}

# Arquivos proibidos/fragmentos (não injetar)
FORBIDDEN_FILES = {
    "footer.html",
    "global-body-elements.html",
    "downloads.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html",
    "menu-global.html",
    "header.html",
    "offline.html",
    "mapa-do-site.html",
}

# Arquivos que terminam com esses sufixos são templates (não injetar)
TEMPLATE_SUFFIXES = (".template.html",)

MARKER = "ANÚNCIO DISPLAY HORIZONTAL (PÓS-BOTÃO / PRÉ-RESULTADO)"

AD_BLOCK = """<!-- ANÚNCIO DISPLAY HORIZONTAL (PÓS-BOTÃO / PRÉ-RESULTADO) COM ANTI-CLS -->
<div style="min-height: 100px; width: 100%; margin-top: 24px; margin-bottom: 24px; text-align: center;" class="no-print" aria-hidden="true">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847" crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
         style="display:block; min-height: 90px;"
         data-ad-client="ca-pub-6472730056006847"
         data-ad-slot="5690484911"
         data-ad-format="horizontal"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
</div>
<!-- FIM DO ANÚNCIO -->"""

# Abertura de elemento com id="resultado-section" (div/section/aside/article)
RESULTADO_RE = re.compile(
    r'<(div|section|aside|article)\b[^>]*\bid\s*=\s*["\']resultado-section["\'][^>]*>',
    re.IGNORECASE,
)


def find_resultado_anchor(html):
    """Retorna o índice do início da tag <div/section id="resultado-section">."""
    m = RESULTADO_RE.search(html)
    if not m:
        return None
    return m.start()


def detect_eol(content):
    """Retorna '\r\n' se o arquivo usar CRLF, senão '\n'."""
    return "\r\n" if "\r\n" in content else "\n"


def collect_files():
    files = []
    # Raiz (apenas top-level)
    try:
        for name in os.listdir(ROOT):
            if name.endswith(".html"):
                files.append(os.path.join(ROOT, name))
    except OSError:
        pass
    # 18 idiomas (recursivo, pulando pastas proibidas)
    for lang in LANGS:
        lang_dir = os.path.join(ROOT, lang)
        if not os.path.isdir(lang_dir):
            continue
        for dirpath, dirnames, filenames in os.walk(lang_dir):
            dirnames[:] = [d for d in dirnames if d not in FORBIDDEN_DIRS]
            for fn in filenames:
                if fn.endswith(".html"):
                    files.append(os.path.join(dirpath, fn))
    return files


def is_forbidden(rel, name):
    parts = rel.split(os.sep)
    if any(p in FORBIDDEN_DIRS for p in parts[:-1]):
        return True
    if name in FORBIDDEN_FILES:
        return True
    if name.endswith(TEMPLATE_SUFFIXES):
        return True
    return False


def main():
    dry_run = "--dry-run" in sys.argv
    files = collect_files()

    injected = []
    skipped_existing = []
    skipped_no_resultado = []
    skipped_forbidden = []

    for path in files:
        rel = os.path.relpath(path, ROOT)
        name = os.path.basename(path)

        if is_forbidden(rel, name):
            skipped_forbidden.append(rel)
            continue

        # Lê preservando line endings (sem tradução universal de newline)
        with open(path, "r", encoding="utf-8", newline="") as f:
            content = f.read()

        # Idempotência: já tem este anúncio?
        if MARKER in content:
            skipped_existing.append(rel)
            continue

        anchor = find_resultado_anchor(content)
        if anchor is None:
            skipped_no_resultado.append(rel)
            continue

        eol = detect_eol(content)
        ad_block = AD_BLOCK.replace("\n", eol)
        new_content = content[:anchor] + ad_block + eol + content[anchor:]

        if not dry_run:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(new_content)
        injected.append(rel)

    print("=" * 70)
    print(f"MODO: {'DRY-RUN (nada foi alterado)' if dry_run else 'APLICAÇÃO REAL'}")
    print("=" * 70)
    print(f"INJETADOS: {len(injected)}")
    for r in injected:
        print("  +", r)
    print()
    print(f"JÁ EXISTE (pulado): {len(skipped_existing)}")
    print(f"SEM id=resultado-section (pulado): {len(skipped_no_resultado)}")
    print(f"PROIBIDOS/FRAGMENTOS (pulado): {len(skipped_forbidden)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
