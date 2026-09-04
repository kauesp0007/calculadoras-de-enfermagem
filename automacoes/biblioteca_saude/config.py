"""Configurações centrais do Sistema de Biblioteca de Conhecimento em Saúde.

Centraliza caminhos, extensões aceitas e mapeamentos (spec §73). Nenhuma
configuração importante deve ficar espalhada pelos demais módulos.
"""

from pathlib import Path

# ── Caminhos (raiz do projeto) ────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENTRADA_DIR = BASE_DIR / "LIVROS_PARA_O_AGENTE_LER"     # caixa de entrada (§6)
JSON_DIR = BASE_DIR / "biblioteca_de_enfermagem_json"   # dados estruturados (§8)
SCHEMAS_DIR = JSON_DIR / "schemas"
CATALOGO_DIR = JSON_DIR / "catalogo"
DOCUMENTOS_DIR = CATALOGO_DIR / "documentos"            # um JSON por documento fonte
EXTRATOS_DIR = JSON_DIR / "extratos"                    # texto bruto extraído (FASE 5)
SAIDA_DOCX_DIR = BASE_DIR / "biblioteca_de_enfermagem"  # saída .docx (§26)
LOGS_DIR = BASE_DIR / "logs"

INDEX_DOCUMENTOS = CATALOGO_DIR / "index_documentos.json"
MANIFEST = JSON_DIR / "manifest.json"

# ── Extensões aceitas (caixa de entrada) ──────────────────────────────
EXTENSOES_ACEITAS = {
    ".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".md",
    ".epub", ".mobi", ".csv", ".xlsx", ".xls",
    ".mp4", ".webm", ".mp3", ".wav",
}

# ── Estimativa de tipo documental por extensão ────────────────────────
# Somente quando a extensão é inequívoca. Caso contrário, `None` e o tipo
# documental fino é definido na FASE 6 (catalogação) — spec §4, §66.
EXTENSAO_PARA_TIPO = {
    ".epub": "BOOK",
    ".mobi": "BOOK",
    ".csv": "TECHNICAL_REPORT",
    ".xlsx": "TECHNICAL_REPORT",
    ".xls": "TECHNICAL_REPORT",
}

# ── Modo de execução ──────────────────────────────────────────────────
DRY_RUN = False  # sobrescrito pela flag --dry-run (spec §42)
