"""Configuração central do sistema de tradução v2 — automacoes/translation.

REGRAS DE SEGURANÇA:
- Chaves de API vêm EXCLUSIVAMENTE do arquivo .env (variáveis de ambiente).
- NUNCA gravar chaves em código, em logs ou em arquivos versionados.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------
# 1. PROVEDORES DE API
# ---------------------------------------------------------------
# Valores aceitos: "deepseek", "openai", "both" (padrão).
# "both" = ALTERNÂNCIA com fallback: cada tentativa usa o próximo provider
# (deepseek ↔ openai); se um falhar, o outro assume.
TRANSLATION_PROVIDER = os.getenv("TRANSLATION_PROVIDER", "both").strip().lower()

API_KEYS = {
    "deepseek": os.getenv("DEEPSEEK_API_KEY"),
    "openai": os.getenv("OPENAI_API_KEY"),
}

MODELOS = {
    "deepseek": "deepseek-chat",
    "openai": "gpt-4o-mini",
}

ENDPOINTS = {
    "deepseek": "https://api.deepseek.com/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
}

# ---------------------------------------------------------------
# 2. TIMEOUTS E RETRY (centralizados — valem para TODAS as chamadas)
# ---------------------------------------------------------------
TIMEOUT_CONEXAO = int(os.getenv("TRANSLATION_TIMEOUT_CONEXAO", "30"))
TIMEOUT_LEITURA = int(os.getenv("TRANSLATION_TIMEOUT_LEITURA", "300"))
MAX_TENTATIVAS = int(os.getenv("TRANSLATION_MAX_TENTATIVAS", "3"))
BACKOFF_BASE_SEGUNDOS = 5

# Total de tentativas de ALTERNÂNCIA (fallback) antes de desistir de uma
# tradução: com "both", são 5 rodadas deepseek↔openai antes do erro.
MAX_TENTATIVAS_FALLBACK = int(os.getenv("TRANSLATION_MAX_FALLBACK", "10"))

# ---------------------------------------------------------------
# 3. BATCHING INTELIGENTE
# ---------------------------------------------------------------
MAX_TRANSLATION_CHARS = int(os.getenv("TRANSLATION_MAX_CHARS", "12000"))
MAX_TRANSLATION_ITEMS = int(os.getenv("TRANSLATION_MAX_ITEMS", "200"))
MAX_TRANSLATION_TOKENS_ESTIMATED = int(os.getenv("TRANSLATION_MAX_TOKENS", "6000"))

# ---------------------------------------------------------------
# 4. IDIOMAS E LOCALES
# ---------------------------------------------------------------
IDIOMA_ORIGEM = "pt-BR"

IDIOMAS_SUPORTADOS = [
    "en", "es", "fr", "de", "it", "ja", "zh", "hi", "ar",
    "ru", "tr", "ko", "nl", "pl", "sv", "id", "vi", "uk",
]

MAPA_LOCALES = {
    "en": "en-US", "es": "es-ES", "fr": "fr-FR", "it": "it-IT",
    "de": "de-DE", "hi": "hi-IN", "zh": "zh-CN", "ja": "ja-JP",
    "ru": "ru-RU", "ko": "ko-KR", "tr": "tr-TR", "nl": "nl-NL",
    "pl": "pl-PL", "sv": "sv-SE", "id": "id-ID", "vi": "vi-VN",
    "uk": "uk-UA", "ar": "ar-SA",
}

NOMES_IDIOMAS = {
    "en": "Inglês", "es": "Espanhol", "fr": "Francês", "it": "Italiano",
    "de": "Alemão", "hi": "Hindi", "zh": "Chinês (simplificado)", "ar": "Árabe",
    "ja": "Japonês", "ru": "Russo", "ko": "Coreano", "tr": "Turco",
    "nl": "Holandês", "pl": "Polonês", "sv": "Sueco", "id": "Indonésio",
    "vi": "Vietnamita", "uk": "Ucraniano",
}

# Idiomas com escrita não latina (fontes especiais gerenciadas pelo font_manager)
IDIOMAS_FONTES_ESPECIAIS = ["ar", "zh", "hi", "ja", "ko"]

# ---------------------------------------------------------------
# 5. DOMÍNIO
# ---------------------------------------------------------------
DOMINIO = "https://www.calculadorasdeenfermagem.com.br"

# ---------------------------------------------------------------
# 6. CAMINHOS DO SISTEMA
# ---------------------------------------------------------------
PASTA_RAIZ = Path(__file__).resolve().parent        # automacoes/translation
PASTA_AUTOMACOES = PASTA_RAIZ.parent                 # automacoes
PASTA_PROJETO = PASTA_AUTOMACOES.parent              # raiz do repositório

PASTA_CACHE = PASTA_RAIZ / "cache"
PASTA_LOGS = PASTA_CACHE / "logs"
CAMINHO_MEMORIA = PASTA_CACHE / "traducao_memoria.sqlite"
CAMINHO_GLOSSARIO = PASTA_AUTOMACOES / "traducao_glossario.json"
CAMINHO_LOG = PASTA_LOGS / "traducao_v2.log"
