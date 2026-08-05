"""Configurações do UI Catalog Engine."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "CATALOGO_DE_IDENTIDADE_VISUAL"
TXT_OUTPUT = OUTPUT_DIR / "CATALOGO_DO_DESIGN_SYSTEM.txt"
MD_OUTPUT = OUTPUT_DIR / "CATALOGO_DO_DESIGN_SYSTEM.md"

# Arquivos CSS a analisar
CSS_FILES = [
    BASE_DIR / "global-styles.css",
    BASE_DIR / "public" / "output.css",
]

# Pastas HTML a analisar para componentes
HTML_DIRS = [
    BASE_DIR,                    # raiz (todos os HTMLs)
    BASE_DIR / "conta",          # sistema de contas
]

# Amostra máxima de HTMLs (0 = sem limite)
MAX_HTML_SAMPLE = 0

# Breakpoints comuns do Tailwind
BREAKPOINTS = {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px",
}

# Categorias de cores por nome de variável CSS
COLOR_CATEGORIES = {
    "navy": "Primária",
    "blue": "Informação",
    "green": "Sucesso",
    "red": "Erro",
    "amber": "Aviso",
    "slate": "Neutra",
    "gray": "Neutra",
    "white": "Neutra",
    "black": "Neutra",
}
