"""Configurações centralizadas do Catalogador Inteligente."""

import os
from pathlib import Path

# ── Carrega variáveis do .env (se existir) ────────────────────────────
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv não instalado, usa variáveis de ambiente do sistema

# ── Caminhos ──────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # raiz do projeto
DOCS_DIR = BASE_DIR / "docs"
LOGS_DIR = BASE_DIR / "logs"
AUTOMACOES_DIR = BASE_DIR / "automacoes"
CATALOGADOR_DIR = AUTOMACOES_DIR / "catalogador"

# Banco de dados e cache
DB_PATH = CATALOGADOR_DIR / "catalogador.db"
CACHE_PATH = CATALOGADOR_DIR / "catalogador_cache.json"

# Arquivos de saída (dentro de docs/)
MANIFESTO_JSON_PATH = DOCS_DIR / "manifesto.json"
MANIFESTO_CSV_PATH = DOCS_DIR / "manifesto.csv"

# ── API DeepSeek ──────────────────────────────────────────────────────
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"  # ou "deepseek-reasoner"

# Rate limiting
DEEPSEEK_MAX_RPM = 10          # máximo de requisições por minuto
DEEPSEEK_MAX_RETRIES = 3       # tentativas em caso de falha
DEEPSEEK_RETRY_DELAY = 2.0     # segundos entre retries (base para backoff)
DEEPSEEK_TIMEOUT = 60          # timeout por requisição (segundos)
DEEPSEEK_MAX_TOKENS_OUT = 1500 # máximo de tokens na resposta

# Custos por milhão de tokens (USD) — preços DeepSeek em ago/2026
DEEPSEEK_COST_INPUT_PER_M = 0.27   # $0.27 por 1M tokens input
DEEPSEEK_COST_OUTPUT_PER_M = 1.10  # $1.10 por 1M tokens output

# ── Processamento de PDF ──────────────────────────────────────────────
PDF_MAX_PAGES_TEXT = 15          # máx páginas para extração de texto
PDF_MIN_CHARS_FOR_TEXT = 200     # se texto < isso, dispara OCR
OCR_LANG = "por"                 # idioma padrão para Tesseract
OCR_DPI = 300                    # DPI para renderização de páginas no OCR

# ── Snippet Builder ───────────────────────────────────────────────────
SNIPPET_CAPA_CHARS = 3000        # caracteres do início do documento
SNIPPET_HEADING_CHARS = 1000     # caracteres por heading/section
SNIPPET_MAX_HEADINGS = 3         # máximo de headings a incluir
SNIPPET_MAX_TOTAL_CHARS = 12000  # limite total do snippet (~6K tokens)

# ── Monitoramento ─────────────────────────────────────────────────────
WATCH_DEBOUNCE_SECONDS = 2.0     # espera após detecção (arquivo copiando)
WATCH_PATTERNS = ["*.pdf"]       # padrões de arquivo monitorados

# ── Logging ───────────────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
LOG_MAX_BYTES = 5 * 1024 * 1024  # 5 MB por arquivo de log
LOG_BACKUP_COUNT = 3             # manter 3 rotações

# ── Interface (TUI) ───────────────────────────────────────────────────
TUI_REFRESH_RATE = 0.5           # segundos entre atualizações da TUI
TUI_MAX_RECENT = 10              # máximo de itens em "últimos processados"
