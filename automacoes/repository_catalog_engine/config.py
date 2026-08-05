"""Configurações centralizadas do Repository Catalog Engine.

Todas as constantes, caminhos e padrões de ignorar estão aqui.
Nenhum outro módulo deve ter valores hardcoded.
"""

from pathlib import Path

# ── Caminhos ──────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # raiz do projeto
OUTPUT_DIR = BASE_DIR / "CATALOGO_DO_SITE"

# Fase 1
TXT_OUTPUT = OUTPUT_DIR / "CATALOGO_DO_REPOSITORIO.txt"
MD_OUTPUT = OUTPUT_DIR / "CATALOGO_DO_REPOSITORIO.md"

# Fase 2 - Análise estrutural
FASE2_TXT = OUTPUT_DIR / "ANALISE_ESTRUTURAL.txt"
FASE2_MD = OUTPUT_DIR / "ANALISE_ESTRUTURAL.md"

# Fase 3 - Mapa de dependências
FASE3_TXT = OUTPUT_DIR / "DEPENDENCIAS.txt"
FASE3_MD = OUTPUT_DIR / "MAPA_DE_DEPENDENCIAS.md"

# Fase 4 - Mapa de navegação
FASE4_TXT = OUTPUT_DIR / "MAPA_DE_NAVEGACAO.txt"
FASE4_MD = OUTPUT_DIR / "MAPA_DE_NAVEGACAO.md"

# Fase 5 - Auditoria técnica
FASE5_TXT = OUTPUT_DIR / "AUDITORIA_TECNICA.txt"
FASE5_MD = OUTPUT_DIR / "AUDITORIA_TECNICA.md"

# ── Padrões de ignorar (pastas e arquivos) ───────────────────────────
# Pastas que NUNCA devem ser varridas
IGNORE_DIRS = {
    ".git",
    ".github",
    ".vscode",
    "__pycache__",
    ".ai",
    "node_modules",
    "logs",
    "temp",
    ".trash",
}

# Arquivos/padrões que NUNCA devem ser catalogados
IGNORE_FILES = {
    ".gitignore",
    ".gitattributes",
    ".env",
    "thumbs.db",
    "desktop.ini",
    ".DS_Store",
}

# Extensões que são ignoradas completamente
IGNORE_EXTENSIONS = {
    ".db",          # bancos SQLite
    ".pyc",         # bytecode Python
    ".bak",         # backups
    ".tmp",         # temporários
    ".lock",        # lock files
}

# ── Classificação por tipo ────────────────────────────────────────────

# Extensões de imagem
IMAGE_EXTENSIONS = {
    ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg",
    ".ico", ".bmp", ".tiff", ".tif", ".avif",
}

# Extensões de vídeo/áudio
VIDEO_EXTENSIONS = {
    ".mp4", ".webm", ".ogg", ".ogv", ".mov", ".avi",
    ".mp3", ".wav", ".flac", ".aac",
}

# Extensões de documentos
DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".ppt", ".pptx", ".odt", ".ods", ".odp",
    ".txt", ".csv", ".rtf",
}

# Extensões de fontes
FONT_EXTENSIONS = {
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
}

# Extensões do sistema/ferramentas
SYSTEM_EXTENSIONS = {
    ".bat", ".ps1", ".sh",      # scripts shell
    ".cmd",                      # batch Windows
    ".yml", ".yaml",             # configuração
    ".toml",                     # configuração
    ".cfg", ".ini",              # configuração
    ".md",                       # documentação
    ".py",                       # Python (automações)
    ".sql",                      # SQL
    ".xml",                      # XML (sitemaps, etc.)
    ".gitkeep",                  # Git placeholder
    ".log",                      # logs
}

# ── Idiomas do projeto ────────────────────────────────────────────────
# Pastas de idioma na raiz (ex: /en/, /es/, etc.)
LANGUAGE_FOLDERS = {
    "en", "es", "de", "it", "fr", "hi", "zh",
    "ar", "ja", "ru", "ko", "tr", "nl", "pl",
    "sv", "id", "vi", "uk",
}

# ── Pastas especiais para agrupamento ─────────────────────────────────
SPECIAL_DIRS = {
    "blog": "blog",
    "biblioteca": "biblioteca",
    "downloads": "downloads",
    "conta": "conta",
    "docs": "docs",
    "automacoes": "automacoes",
    "js": "js",
    "css": "css",
    "img": "img",
    "fonts": "fonts",
    "public": "public",
    "src": "src",
    "DOCS": "docs",
}
