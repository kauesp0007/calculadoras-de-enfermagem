#!/usr/bin/env python3
"""Repara corrupcoes tecnicas antigas nos fast.html traduzidos.

Os textos traduzidos sao preservados. Somente blocos JavaScript estruturais,
que nao contem texto de interface, sao copiados do fast.html de origem.
"""

import re
from pathlib import Path

import tradutor_cirurgico as tradutor


ROOT = Path(__file__).resolve().parent.parent
IDIOMAS = tuple(tradutor.IDIOMA_MAP)


def substituir_regiao(conteudo: str, referencia: str,
                      inicio: str, fim: str) -> str:
    inicio_ref = referencia.find(inicio)
    fim_ref = referencia.find(fim, inicio_ref)
    inicio_dest = conteudo.find(inicio)
    fim_dest = conteudo.find(fim, inicio_dest)
    if min(inicio_ref, fim_ref, inicio_dest, fim_dest) < 0:
        return conteudo
    bloco_correto = referencia[inicio_ref:fim_ref]
    total_crlf = conteudo.count("\r\n")
    total_lf_puro = conteudo.count("\n") - total_crlf
    quebra_destino = "\r\n" if total_crlf > total_lf_puro else "\n"
    bloco_correto = bloco_correto.replace("\r\n", "\n").replace("\r", "\n")
    bloco_correto = bloco_correto.replace("\n", quebra_destino)
    return conteudo[:inicio_dest] + bloco_correto + conteudo[fim_dest:]


def reparar_html(conteudo: str, referencia: str, idioma: str) -> str:
    if "const ITENS_FAST" in conteudo:
        # Templates puramente tecnicos; os labels/opcoes traduzidos ficam no
        # array ITENS_FAST e nao sao substituidos.
        regioes = (
            ("item.opts.forEach((op) => {", "const div = document.createElement"),
            ("div.innerHTML = `", "container.appendChild(div);"),
            ("tr.innerHTML = `", 'document.getElementById("totalObtidoTd")'),
        )
        for inicio, fim in regioes:
            conteudo = substituir_regiao(conteudo, referencia, inicio, fim)

        # Corrupcao antiga observada em template condicional do laudo.
        conteudo = re.sub(r'\?\s*"\s*`(?=<div class="secao")', '? `', conteudo)

    # Versao legada em hindi: promise sem chamada anterior e ponto-e-virgula
    # inserido antes do catch do menu global.
    conteudo = re.sub(
        r'\n\s*\.catch\(\(error\)\s*=>\s*\n'
        r'\s*console\.error\("Error loading modular footer:", error\),\s*\n'
        r'\s*\);\s*\n',
        '\n',
        conteudo,
    )
    conteudo = re.sub(
        r'(document\.getElementById\("global-header-container"\)[\s\S]*?\n\s*\})\);'
        r'(\s*\n\s*\.catch\(\(error\)\s*=>)',
        r'\1)\2',
        conteudo,
        count=1,
    )

    if idioma == "ar":
        # A versao legada tinha o fechamento de um setTimeout inexistente.
        inicio_footer = conteudo.find("// Carrega o footer")
        fim_script = conteudo.find("</script>", inicio_footer)
        if inicio_footer >= 0 and fim_script >= 0:
            bloco = conteudo[inicio_footer:fim_script]
            bloco = bloco.replace("\n}, 150);", "", 1)
            conteudo = conteudo[:inicio_footer] + bloco + conteudo[fim_script:]

    return conteudo.replace("</div>in>", "</div>")


def validar_scripts(caminho: Path, conteudo: str) -> list[str]:
    erros = []
    pattern = re.compile(
        r'<script\b([^>]*)>(.*?</script>)',
        re.IGNORECASE | re.DOTALL,
    )
    for indice, match in enumerate(pattern.finditer(conteudo)):
        attrs = match.group(1).lower()
        if "src=" in attrs or "application/ld+json" in attrs or "application/json" in attrs:
            continue
        codigo = match.group(2)[:-len("</script>")]
        for erro in tradutor.validate_js_syntax(codigo):
            erros.append(f"{caminho}: script {indice}: {erro}")
    return erros


def main() -> int:
    with open(ROOT / "fast.html", "r", encoding="utf-8", newline="") as arquivo:
        referencia = arquivo.read()
    alterados = []
    erros = []

    for idioma in IDIOMAS:
        caminho = ROOT / idioma / "fast.html"
        if not caminho.exists():
            continue
        with open(caminho, "r", encoding="utf-8", newline="") as arquivo:
            original = arquivo.read()
        reparado = reparar_html(original, referencia, idioma)
        erros.extend(validar_scripts(caminho, reparado))
        if reparado != original:
            with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
                arquivo.write(reparado)
            alterados.append(str(caminho.relative_to(ROOT)))

    if erros:
        print("\n".join(erros))
        return 1

    print(f"Arquivos reparados: {len(alterados)}")
    for caminho in alterados:
        print(f"  {caminho}")
    print("Validacao JavaScript: APROVADA")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
