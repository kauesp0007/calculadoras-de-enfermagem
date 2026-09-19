# -*- coding: utf-8 -*-
"""
Injeta o anúncio display horizontal (PRÉ-HERO) antes do hero card em todos os
HTMLs da raiz e das 18 pastas de idiomas, exceto pastas/arquivos proibidos.

Uso:
  python injetar-anuncio-pre-hero.py --dry-run   # apenas relatório (não altera)
  python injetar-anuncio-pre-hero.py             # aplica de fato
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

MARKER = "ANÚNCIO DISPLAY HORIZONTAL (PRÉ-HERO)"

AD_BLOCK = """<!-- ANÚNCIO DISPLAY HORIZONTAL (PRÉ-HERO) COM ANTI-CLS -->
<div style="min-height: 100px; width: 100%; margin-bottom: 24px; text-align: center;" class="no-print" aria-hidden="true">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847" crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
         style="display:block; min-height: 90px;"
         data-ad-client="ca-pub-6472730056006847"
         data-ad-slot="2979726942"
         data-ad-format="horizontal"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
</div>
<!-- FIM DO ANÚNCIO -->"""

# Localiza a abertura do container do hero (o elemento que contém o <h1>):
# <section>/<header> ou <div> com classe indicativa de hero.
HERO_OPEN_RE = re.compile(
    r'<(section|header)\b[^>]*>'
    r'|<div\b[^>]*class="[^"]*(?:mini-hero|card-navy|hero-navy|gradient-hero|hero-card|hero-banner|\bhero\b|bg-gradient)[^"]*"[^>]*>',
    re.IGNORECASE,
)


def find_hero_anchor(html):
    """Retorna a posição (índice) para inserir o anúncio:
    antes do container do hero; se não houver hero, antes do <h1>."""
    h1 = re.search(r'<h1\b', html, re.IGNORECASE)
    if not h1:
        return None
    prefix = html[:h1.start()]
    matches = list(HERO_OPEN_RE.finditer(prefix))
    if matches:
        return matches[-1].start()
    return h1.start()  # fallback: sem hero card, insere antes do <h1>


def collect_files():
    files = []
    # Raiz (apenas top-level)
    try:
        for name in os.listdir(ROOT):
            if name.endswith(".html"):
                files.append(os.path.join(ROOT, name))
    except OSError:
        pass
    # 18 idiomas (recursivo)
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
    skipped_no_hero = []
    skipped_forbidden = []

    for path in files:
        rel = os.path.relpath(path, ROOT)
        name = os.path.basename(path)

        if is_forbidden(rel, name):
            skipped_forbidden.append(rel)
            continue

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Idempotência: já tem o anúncio?
        if MARKER in content:
            skipped_existing.append(rel)
            continue

        anchor = find_hero_anchor(content)
        if anchor is None:
            skipped_no_hero.append(rel)
            continue

        new_content = content[:anchor] + AD_BLOCK + "\n" + content[anchor:]

        if not dry_run:
            with open(path, "w", encoding="utf-8") as f:
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
    print(f"SEM HERO <h1>/container (pulado): {len(skipped_no_hero)}")
    for r in skipped_no_hero:
        print("  ?", r)
    print(f"PROIBIDOS/FRAGMENTOS (pulado): {len(skipped_forbidden)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
