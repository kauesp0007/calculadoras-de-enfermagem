import os
import re

# Pasta raiz do projeto
ROOT = os.getcwd()

# Pastas ignoradas
IGNORE_DIRS = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "locales",
    "fonts",
}

LINK_TEMPLATE = (
    '<link rel="preload" as="image" '
    'href="/img/banner_index_h1_calculadoras-de-enfermagem-{lang}.webp" '
    'fetchpriority="high">'
)

arquivos_alterados = 0
arquivos_ignorados = 0

for root, dirs, files in os.walk(ROOT):

    # Remove pastas ignoradas
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

    if "index.html" not in files:
        continue

    caminho = os.path.join(root, "index.html")

    with open(caminho, "r", encoding="utf-8") as f:
        html = f.read()

    # Procura o idioma
    m = re.search(r'<html[^>]*\blang="([a-z]{2})"', html, re.IGNORECASE)

    if not m:
        print(f"[SEM LANG] {caminho}")
        continue

    lang = m.group(1)

    novo_link = LINK_TEMPLATE.format(lang=lang)

    # Evita duplicação
    if novo_link in html:
        arquivos_ignorados += 1
        print(f"[JÁ EXISTE] {caminho}")
        continue

    # Insere após </title>
    html_novo = re.sub(
        r"(</title>)",
        r"\1\n" + novo_link,
        html,
        count=1,
        flags=re.IGNORECASE,
    )

    if html != html_novo:
        with open(caminho, "w", encoding="utf-8", newline="") as f:
            f.write(html_novo)

        arquivos_alterados += 1
        print(f"[OK] {lang} -> {caminho}")

print()
print("=" * 60)
print(f"Arquivos alterados : {arquivos_alterados}")
print(f"Arquivos ignorados : {arquivos_ignorados}")
print("=" * 60)