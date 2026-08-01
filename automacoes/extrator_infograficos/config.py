from pathlib import Path


BASE_DIR = Path(__file__).parent

ENTRADA = BASE_DIR / "entrada"
SAIDA = BASE_DIR / "saida"
TEMP = BASE_DIR / "temp"
APROVADOS = TEMP / "aprovados"
LOGS = BASE_DIR / "logs"
BIBLIOTECA = BASE_DIR / "biblioteca"
CACHE = BASE_DIR / "cache"

QUALIDADE_WEBP = 90
AREA_MINIMA = 1500
LARGURA_MAXIMA_OBJETO = 900
ALTURA_MAXIMA_OBJETO = 900

MODELO_OPENAI = "gpt-4.1"
MAXIMO_TENTATIVAS_OPENAI = 3
CATEGORIAS_COMPONENTES = (
    "logo",
    "icone",
    "imagem",
    "fotografia",
    "tabela",
    "texto",
    "linha",
    "grafico",
    "decoracao",
)
CATEGORIAS_EXTRAIVEIS = (
    "logo",
    "icone",
    "imagem",
    "fotografia",
)
