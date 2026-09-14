#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
substituir-footer-raiz.py
-------------------------
Substitui o bloco de injeção do footer nos HTMLs da RAIZ do repositório,
removendo a dependência do sistema i18n (carregarTraducoes) e trocando
`fetch("/footer.html")` por `fetch("footer.html")` (padrão das pastas de idioma).

Regras:
- Processa SOMENTE os arquivos .html diretamente na raiz (não recursivo).
- Pula arquivos proibidos (modulares, templates e páginas protegidas).
- Substitui apenas blocos <script>...</script> que contenham "footer.html"
  E "carregarTraducoes" (ou seja, o script de injeção do footer com i18n).
"""

import os
import re

RAIZ = os.path.dirname(os.path.abspath(__file__))

# Arquivos que NÃO devem ser alterados (modulares, templates e protegidos).
ARQUIVOS_PROIBIDOS = {
    "footer.html",                 # modular (já é o próprio footer)
    "menu-global.html",            # modular
    "global-body-elements.html",   # modular
    "downloads.html",              # página protegida
    "downloads.template.html",     # template
    "item.template.html",          # template
    "menu-lateral.html",           # modular
    "_language_selector.html",     # modular
    "googlefc0a17cdd552164b.html", # verificação Google
    "header.html",                 # modular (header)
}

# Captura um bloco <script>...</script> inteiro sem atravessar o fechamento
# (importante quando há dois <script> consecutivos no mesmo arquivo).
SCRIPT_RE = re.compile(r"<script>(?:(?!</script>)[\s\S])*?</script>")

NOVO_BLOCO = """<script>
document.addEventListener("DOMContentLoaded", () => {
setTimeout(() => {
fetch("footer.html")
.then((response) => response.text())
.then((data) => {
document.getElementById("footer-placeholder").innerHTML = data;
});
}, 150);
});
</script>"""


def substituir_footer(conteudo):
    """Substitui o script do footer (com i18n) pelo padrão simples."""

    def repl(match):
        bloco = match.group(0)
        if "footer.html" in bloco and "carregarTraducoes" in bloco:
            return NOVO_BLOCO
        return bloco

    return SCRIPT_RE.sub(repl, conteudo)


def ler_arquivo(caminho):
    """Lê o arquivo tentando encodings comuns, retornando (texto, encoding)."""
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            with open(caminho, "r", encoding=enc) as fh:
                return fh.read(), enc
        except UnicodeDecodeError:
            continue
    return None, None


def main():
    todos = sorted(f for f in os.listdir(RAIZ) if f.endswith(".html"))
    pulados = [f for f in todos if f in ARQUIVOS_PROIBIDOS]
    alvos = [f for f in todos if f not in ARQUIVOS_PROIBIDOS]

    modificados = []
    nao_modificados = []
    erros = []

    for nome in alvos:
        caminho = os.path.join(RAIZ, nome)
        original, enc = ler_arquivo(caminho)
        if original is None:
            erros.append(nome)
            continue

        novo = substituir_footer(original)
        if novo != original:
            with open(caminho, "w", encoding="utf-8") as fh:
                fh.write(novo)
            modificados.append(nome)
        else:
            nao_modificados.append(nome)

    print("=" * 64)
    print(f"Modificados: {len(modificados)}")
    for n in modificados:
        print(f"  [OK]  {n}")

    print()
    print(f"Sem alteração (já ok ou sem o padrão): {len(nao_modificados)}")
    for n in nao_modificados:
        print(f"  [==]  {n}")

    if erros:
        print()
        print(f"Erros de leitura: {len(erros)}")
        for n in erros:
            print(f"  [ERRO] {n}")

    print()
    print(f"Pulados (proibidos): {len(pulados)}")
    for n in pulados:
        print(f"  [SKIP] {n}")


if __name__ == "__main__":
    main()
