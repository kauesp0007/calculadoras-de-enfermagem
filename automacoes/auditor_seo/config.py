"""Configurações centralizadas do Auditor SEO."""

from pathlib import Path

# ── Domínio ───────────────────────────────────────────────────────────
DOMINIO = "https://www.calculadorasdeenfermagem.com.br"

# ── Pastas ignoradas (não auditar) ────────────────────────────────────
PASTAS_IGNORAR = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "node_modules",
    ".git",
    "backups_seo",
    "automacoes",
    "logs",
    "fonts",
    "public",
    "src",
    "test_catalogador",
    "partials",
    ".chrome-perfil-pci",
}

# ── Arquivos ignorados permanentemente ───────────────────────────────
ARQUIVOS_IGNORAR = {
    "footer.html",
    "menu-global.html",
    "global-body-elements.html",
    "downloads.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html",
    "item.template.html",
}

# ── Idiomas suportados (para hreflang) ───────────────────────────────
IDIOMAS = [
    ("pt-br", ""),       # raiz (sem pasta)
    ("en", "en"),
    ("es", "es"),
    ("de", "de"),
    ("it", "it"),
    ("fr", "fr"),
    ("hi", "hi"),
    ("zh", "zh"),
    ("ar", "ar"),
    ("ja", "ja"),
    ("ru", "ru"),
    ("ko", "ko"),
    ("tr", "tr"),
    ("nl", "nl"),
    ("pl", "pl"),
    ("sv", "sv"),
    ("id", "id"),
    ("vi", "vi"),
    ("uk", "uk"),
]

# ── Raiz do projeto ───────────────────────────────────────────────────
RAIZ = Path(__file__).resolve().parent.parent.parent

# ── Pastas de saída ───────────────────────────────────────────────────
BACKUPS_DIR = RAIZ / "backups_seo"
LOGS_DIR = RAIZ / "logs"

# ── Elementos a auditar ───────────────────────────────────────────────
_ELEMENTOS = [
    "canonical",
    "og_url",
    "twitter_url",
    "hreflang",
    "jsonld_url",
    "jsonld_mainentity",
    "breadcrumb_item",
]
