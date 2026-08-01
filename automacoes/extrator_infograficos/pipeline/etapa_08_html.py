import html
import json
from pathlib import Path
from typing import Any

from config import BASE_DIR, SAIDA


URL_CANONICA = "https://www.calculadorasdeenfermagem.com.br/componentes-infografico.html"


def validar_manifesto(manifesto: Any) -> dict[str, Any]:
    """Valida os campos necessários para gerar a página HTML."""

    if not isinstance(manifesto, dict):
        raise TypeError("O manifesto deve ser um objeto.")

    componentes = manifesto.get("componentes")
    quantidade = manifesto.get("quantidade")

    if not isinstance(componentes, list):
        raise ValueError("O manifesto não contém uma lista de componentes.")

    if not isinstance(quantidade, int) or quantidade != len(componentes):
        raise ValueError("A quantidade do manifesto não corresponde aos componentes.")

    for componente in componentes:
        if not isinstance(componente, dict):
            raise TypeError("Cada componente do manifesto deve ser um objeto.")

        arquivo = componente.get("arquivo")

        if not isinstance(arquivo, str) or not (BASE_DIR / arquivo).is_file():
            raise FileNotFoundError(f"Componente do HTML não encontrado: {arquivo}")

    return manifesto


def criar_json_ld(manifesto: dict[str, Any]) -> str:
    """Cria JSON-LD de uma coleção de componentes gráficos."""

    dados = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Componentes extraídos de infográfico",
        "description": "Biblioteca reutilizável de componentes gráficos em WEBP.",
        "url": URL_CANONICA,
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": manifesto["quantidade"],
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": indice,
                    "name": componente["nome"],
                    "description": componente["descricao"],
                }
                for indice, componente in enumerate(
                    manifesto["componentes"],
                    start=1,
                )
            ],
        },
    }
    return json.dumps(dados, indent=4, ensure_ascii=False)


def criar_cartao(componente: dict[str, Any], indice: int) -> str:
    """Cria o HTML semântico de um componente do manifesto."""

    nome = html.escape(componente["nome"] or f"Componente {componente['id']}")
    descricao_original = componente["descricao"] or nome
    descricao = html.escape(descricao_original)
    categoria = html.escape(componente["categoria"])
    tipo = html.escape(componente["tipo"])
    caminho_imagem = html.escape(f"../{componente['arquivo']}", quote=True)
    carregamento = "eager" if indice == 1 else "lazy"

    return f"""            <article class="rounded-lg border bg-white p-4 shadow-sm">
                <figure>
                    <img src="{caminho_imagem}" alt="{descricao}" width="{componente['largura']}" height="{componente['altura']}" loading="{carregamento}" decoding="async">
                    <figcaption>
                        <h2 class="mt-4 text-xl font-semibold">{nome}</h2>
                        <p>{descricao}</p>
                        <p>Categoria: {categoria}. Tipo: {tipo}.</p>
                    </figcaption>
                </figure>
            </article>"""


def montar_html(manifesto: dict[str, Any]) -> str:
    """Monta a página HTML completa a partir de um manifesto validado."""

    cartoes = "\n".join(
        criar_cartao(componente, indice)
        for indice, componente in enumerate(manifesto["componentes"], start=1)
    )
    json_ld = criar_json_ld(manifesto).replace("</", "<\\/")
    descricao = (
        f"Biblioteca com {manifesto['quantidade']} componentes gráficos "
        "extraídos e convertidos para WEBP."
    )

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Componentes extraídos de infográfico</title>
    <meta name="description" content="{descricao}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{URL_CANONICA}">
    <link rel="alternate" hreflang="pt-BR" href="{URL_CANONICA}">
    <link rel="alternate" hreflang="x-default" href="{URL_CANONICA}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Componentes extraídos de infográfico">
    <meta property="og:description" content="{descricao}">
    <meta property="og:url" content="{URL_CANONICA}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Componentes extraídos de infográfico">
    <meta name="twitter:description" content="{descricao}">
    <link rel="stylesheet" href="/global-styles.css">
    <script type="application/ld+json">
{json_ld}
    </script>
</head>
<body class="bg-gray-50 text-gray-900">
    <header class="border-b bg-white p-4">
        <nav aria-label="Navegação principal">
            <a href="/">Calculadoras de Enfermagem</a>
        </nav>
    </header>
    <main id="main-content" class="mx-auto max-w-7xl p-4 sm:p-8">
        <section aria-labelledby="titulo-componentes">
            <h1 id="titulo-componentes" class="mb-4 text-3xl font-bold">Componentes extraídos de infográfico</h1>
            <p class="mb-8">{descricao}</p>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
{cartoes}
            </div>
        </section>
    </main>
    <footer class="border-t bg-white p-4">
        <p>Componentes gráficos reutilizáveis para conteúdos de enfermagem.</p>
    </footer>
</body>
</html>
"""


def gerar_html(manifesto: dict[str, Any]) -> Path:
    """Valida o manifesto e gera a página HTML reutilizável."""

    print("\n========================================")
    print("ETAPA 08 - GERAR HTML")
    print("========================================")

    manifesto_validado = validar_manifesto(manifesto)
    conteudo = montar_html(manifesto_validado)

    if conteudo.count("<h1") != 1:
        raise ValueError("O HTML gerado deve possuir exatamente um H1.")

    SAIDA.mkdir(parents=True, exist_ok=True)
    arquivo = SAIDA / "componentes.html"
    arquivo.write_text(conteudo, encoding="utf-8")

    if not arquivo.is_file() or arquivo.stat().st_size == 0:
        raise RuntimeError(f"Falha ao gerar HTML: {arquivo}")

    print(f"Componentes no HTML: {manifesto_validado['quantidade']}")
    print(f"Arquivo criado: {arquivo.name}")
    return arquivo
