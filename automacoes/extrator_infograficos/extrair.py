from config import ENTRADA
from pipeline.etapa_01_abrir_imagem import abrir_imagem
from pipeline.etapa_02_detectar_regioes import detectar_regioes
from pipeline.etapa_03_exportar_objetos import exportar_objetos
from pipeline.etapa_04_analisar_openai import analisar_layout
from pipeline.etapa_05_extrair_objetos import extrair_objetos
from pipeline.etapa_06_exportar_webp import exportar_webp
from pipeline.etapa_07_manifest import gerar_manifest
from pipeline.etapa_08_html import gerar_html


def main() -> None:
    """Executa as oito etapas oficiais do extrator de infográficos."""

    print("=" * 60)
    print("EXTRATOR INTELIGENTE DE INFOGRÁFICOS")
    print("=" * 60)

    caminho_imagem = ENTRADA / "teste.png"
    imagem = abrir_imagem(caminho_imagem)
    objetos = detectar_regioes(imagem)
    exportar_objetos(imagem, objetos)
    layout = analisar_layout(caminho_imagem)
    componentes_aprovados = extrair_objetos(layout)
    componentes_webp = exportar_webp(componentes_aprovados)
    manifesto = gerar_manifest(componentes_webp, caminho_imagem)
    arquivo_html = gerar_html(manifesto)

    print("\n========================================")
    print("PIPELINE FINALIZADO")
    print("========================================")
    print(f"Imagem: {caminho_imagem.name}")
    print(f"Objetos detectados: {len(objetos)}")
    print(f"Objetos classificados: {len(layout['componentes'])}")
    print(f"Objetos aprovados: {len(componentes_aprovados)}")
    print(f"WEBP gerados: {len(componentes_webp)}")
    print(f"Manifesto: {manifesto['quantidade']} componentes")
    print(f"HTML: {arquivo_html.name}")


if __name__ == "__main__":
    main()
