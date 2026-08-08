#!/usr/bin/env python3
"""
TRADUTOR CIRÚRGICO DE HTML PT-BR → 18 IDIOMAS
Calculadoras de Enfermagem — Sistema de Tradução Automatizada

Arquitetura: Placeholder-based, sem BeautifulSoup, preservação estrutural absoluta.
APIs: DeepSeek + OpenAI com intercalação e fallback.

Uso rápido:
    python tradutor_cirurgico.py

Configuração: Edite a seção CONFIGURAÇÃO abaixo.
"""

import os
import re
import sys
import json
import time
import html
import shutil
import subprocess
import hashlib
import logging
import urllib.request
import urllib.error
import urllib.parse
import ssl
from pathlib import Path
from datetime import datetime
from typing import Optional

# Forcar saida em tempo real (sem buffer)
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass
try:
    sys.stderr.reconfigure(line_buffering=True)
except Exception:
    pass

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         CONFIGURAÇÃO DA TRADUÇÃO                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

ARQUIVOS_PARA_TRADUZIR = [
    "fast.html",
]

IDIOMAS_DESTINO = [
    "en", "es", "fr", "it", "de",
    "hi", "zh", "ja", "ru", "ko",
    "tr", "nl", "pl", "sv", "id",
    "vi", "uk", "ar",
]

# Modo de teste: 1 arquivo, 1 idioma
MODO_TESTE = False

# Dry-run: traduz, audita, mas NÃO publica (não substitui arquivos)
DRY_RUN = False

# Máximo de strings por lote enviado à API
MAX_STRINGS_PER_BATCH = 30

# Máximo de tentativas por lote
MAX_RETRIES = 10

# Tempo de espera entre tentativas (segundos)
RETRY_DELAY = 25

# Tempo de espera entre documentos (segundos)
DOCUMENT_DELAY = 25

# Timeout HTTP (segundos)
HTTP_TIMEOUT = 90

# Máximo de correções automáticas na auditoria
MAX_AUDIT_REPAIRS = 3

# Executar build (tailwind + service worker) após cada tradução publicada
BUILD_AFTER_TRANSLATION = True

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                      MAPA OFICIAL DE IDIOMAS                               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

IDIOMA_MAP = {
    "en": {"lang": "en-US", "nome": "Inglês", "pasta": "en", "regiao": "US",
           "og_locale": "en_US", "font_family": None},
    "es": {"lang": "es-ES", "nome": "Espanhol", "pasta": "es", "regiao": "ES",
           "og_locale": "es_ES", "font_family": None},
    "fr": {"lang": "fr-FR", "nome": "Francês", "pasta": "fr", "regiao": "FR",
           "og_locale": "fr_FR", "font_family": None},
    "it": {"lang": "it-IT", "nome": "Italiano", "pasta": "it", "regiao": "IT",
           "og_locale": "it_IT", "font_family": None},
    "de": {"lang": "de-DE", "nome": "Alemão", "pasta": "de", "regiao": "DE",
           "og_locale": "de_DE", "font_family": None},
    "hi": {"lang": "hi-IN", "nome": "Hindi", "pasta": "hi", "regiao": "IN",
           "og_locale": "hi_IN", "font_family": "devanagari"},
    "zh": {"lang": "zh-CN", "nome": "Chinês", "pasta": "zh", "regiao": "CN",
           "og_locale": "zh_CN", "font_family": "chinese"},
    "ja": {"lang": "ja-JP", "nome": "Japonês", "pasta": "ja", "regiao": "JP",
           "og_locale": "ja_JP", "font_family": "japanese"},
    "ru": {"lang": "ru-RU", "nome": "Russo", "pasta": "ru", "regiao": "RU",
           "og_locale": "ru_RU", "font_family": None},
    "ko": {"lang": "ko-KR", "nome": "Coreano", "pasta": "ko", "regiao": "KR",
           "og_locale": "ko_KR", "font_family": "korean"},
    "tr": {"lang": "tr-TR", "nome": "Turco", "pasta": "tr", "regiao": "TR",
           "og_locale": "tr_TR", "font_family": None},
    "nl": {"lang": "nl-NL", "nome": "Holandês", "pasta": "nl", "regiao": "NL",
           "og_locale": "nl_NL", "font_family": None},
    "pl": {"lang": "pl-PL", "nome": "Polonês", "pasta": "pl", "regiao": "PL",
           "og_locale": "pl_PL", "font_family": None},
    "sv": {"lang": "sv-SE", "nome": "Sueco", "pasta": "sv", "regiao": "SE",
           "og_locale": "sv_SE", "font_family": None},
    "id": {"lang": "id-ID", "nome": "Indonésio", "pasta": "id", "regiao": "ID",
           "og_locale": "id_ID", "font_family": None},
    "vi": {"lang": "vi-VN", "nome": "Vietnamita", "pasta": "vi", "regiao": "VN",
           "og_locale": "vi_VN", "font_family": None},
    "uk": {"lang": "uk-UA", "nome": "Ucraniano", "pasta": "uk", "regiao": "UA",
           "og_locale": "uk_UA", "font_family": None},
    "ar": {"lang": "ar-SA", "nome": "Árabe", "pasta": "ar", "regiao": "SA",
           "og_locale": "ar_SA", "font_family": "arabic"},
}

# Fontes especiais para idiomas não-latinos
SPECIAL_FONTS = {
    "arabic": {
        "css": """<style id="critical-fonts">@font-face{font-family:'Arabic';src:url('/fonts/arabic/arabic-regular.woff2') format('woff2');font-weight:400;font-display:swap;}@font-face{font-family:'Arabic';src:url('/fonts/arabic/arabic-700.woff2') format('woff2');font-weight:700;font-display:swap;}</style>""",
        "preloads": """<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>""",
    },
    "devanagari": {
        "css": """<style id="critical-fonts">@font-face{font-family:'Devanagari';src:url('/fonts/devanagari/devanagari-regular.woff2') format('woff2');font-weight:400;font-display:swap;}@font-face{font-family:'Devanagari';src:url('/fonts/devanagari/devanagari-700.woff2') format('woff2');font-weight:700;font-display:swap;}</style>""",
        "preloads": """<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>""",
    },
    "chinese": {
        "css": """<style id="critical-fonts">@font-face{font-family:'Chinese';src:url('/fonts/chinese/chinese-regular.woff2') format('woff2');font-weight:400;font-display:swap;}</style>""",
        "preloads": """<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>""",
    },
    "japanese": {
        "css": """<style id="critical-fonts">@font-face{font-family:'Japanese';src:url('/fonts/japanese/japanese-regular.woff2') format('woff2');font-weight:400;font-display:swap;}@font-face{font-family:'Japanese';src:url('/fonts/japanese/japanese-700.woff2') format('woff2');font-weight:700;font-display:swap;}</style>""",
        "preloads": """<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>""",
    },
    "korean": {
        "css": """<style id="critical-fonts">@font-face{font-family:'Korean';src:url('/fonts/korean/korean-regular.woff2') format('woff2');font-weight:400;font-display:swap;}@font-face{font-family:'Korean';src:url('/fonts/korean/korean-700.woff2') format('woff2');font-weight:700;font-display:swap;}</style>""",
        "preloads": """<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>""",
    },
}

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                     PROTEÇÃO DE PASTAS E ARQUIVOS                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

PROTECTED_DIRS = {
    ".git", ".github", "node_modules", "assets", "artigos",
    "imagens", "fontes", "public", "src", "docs", "l10n",
}

PROTECTED_EXTENSIONS = {".md", ".json", ".yml", ".yaml"}

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                           INICIALIZAÇÃO                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

ROOT = Path(__file__).resolve().parent.parent
AUTOMACOES = ROOT / "automacoes"
LOG_DIR = AUTOMACOES / "logs_traducao"
LOG_DIR.mkdir(exist_ok=True)

TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")

class FlushStreamHandler(logging.StreamHandler):
    """StreamHandler que forca flush a cada mensagem para log em tempo real."""
    def emit(self, record):
        super().emit(record)
        self.flush()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / f"traducao_{TIMESTAMP}.log", encoding="utf-8"),
        FlushStreamHandler(),
    ],
)
log = logging.getLogger("tradutor")

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         CARREGAR CONFIGURAÇÃO                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def load_env() -> dict:
    """Carrega variáveis do .env sem modificar o arquivo."""
    env_path = ROOT / ".env"
    config = {}
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    config[key] = val
    return config

ENV = load_env()
DEEPSEEK_KEY = ENV.get("DEEPSEEK_API_KEY", "")
OPENAI_KEY = ENV.get("OPENAI_API_KEY", "")
DEEPL_KEY = ENV.get("DEEPL_API_KEY", "")

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    VALIDAÇÃO DE CAMINHOS                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def is_path_protected(filepath: Path) -> bool:
    """Verifica se o caminho está em área protegida."""
    parts = filepath.resolve().relative_to(ROOT.resolve()).parts
    for part in parts:
        if part in PROTECTED_DIRS:
            return True
    if filepath.suffix.lower() in PROTECTED_EXTENSIONS:
        return True
    # Proteger .py fora de automacoes/
    if filepath.suffix == ".py" and "automacoes" not in parts:
        return True
    return False

def validate_source(filepath: Path):
    """Valida arquivo de origem."""
    if not filepath.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {filepath}")
    if is_path_protected(filepath):
        raise PermissionError(f"Arquivo protegido: {filepath}")
    if filepath.suffix.lower() != ".html":
        raise ValueError(f"Não é HTML: {filepath}")

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                     SISTEMA DE PLACEHOLDERS                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

PLACEHOLDER_PREFIX = "___CKO_TR_"

def generate_placeholder(index: int, kind: str = "TEXT") -> str:
    """Gera placeholder único."""
    return f"{PLACEHOLDER_PREFIX}{kind}_{index:06d}___"

def is_placeholder(text: str) -> bool:
    return PLACEHOLDER_PREFIX in text

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                  PROTEÇÃO DE BLOCOS TÉCNICOS                               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def protect_html_blocks(html_content: str) -> tuple[str, dict, dict]:
    """
    Protege blocos tecnicos antes da extracao de textos.
    Usa delimitadores unicos em vez de placeholders com prefixo comum.
    Retorna: (html_com_blocos_protegidos, mapa_protegidos, mapa_reversao)
    """
    protected = {}
    reverse_map = {}
    counter = [0]

    def make_protector(kind):
        def replacer(m):
            idx = counter[0]
            counter[0] += 1
            key = f"__PROTECTED_{kind}_{idx}__"
            original = m.group(0)
            protected[key] = original
            reverse_map[key] = original
            return key
        return replacer

    # Proteger blocos que NAO devem ser tocados pela traducao
    protect_specs = [
        (r'<script\b[^>]*>.*?</script>', "SCRIPT"),
        (r'<style\b[^>]*>.*?</style>', "STYLE"),
        (r'<svg\b[^>]*>.*?</svg>', "SVG"),
        (r'<!--.*?-->', "COMMENT"),
        (r'<pre\b[^>]*>.*?</pre>', "PRE"),
        (r'<code\b[^>]*>.*?</code>', "CODE"),
        (r'<template\b[^>]*>.*?</template>', "TEMPLATE"),
        (r'<noscript\b[^>]*>.*?</noscript>', "NOSCRIPT"),
    ]

    for pattern, kind in protect_specs:
        html_content = re.sub(pattern, make_protector(kind), html_content, flags=re.DOTALL)

    return html_content, protected, reverse_map


def restore_protected_blocks(html_content: str, reverse_map: dict) -> str:
    """Restaura blocos protegidos."""
    result = html_content
    for key, original in reverse_map.items():
        result = result.replace(key, original)
    return result


def extract_text_nodes(html_content: str) -> tuple[str, dict]:
    """
    Extrai textos traduziveis do HTML (ja com blocos protegidos).
    Usa maquina de estados para tracking preciso de tags.
    Retorna: (html_com_placeholders, mapa_textos)
    """
    text_map = {}
    counter = [0]
    result = []
    i = 0
    n = len(html_content)

    while i < n:
        ch = html_content[i]

        if ch == '<':
            # Inicio de tag - avancar ate o fechamento >
            tag_end = html_content.find('>', i)
            if tag_end == -1:
                result.append(ch)
                i += 1
                continue
            # Preservar a tag inteira
            result.append(html_content[i:tag_end + 1])
            i = tag_end + 1
        else:
            # Fora de tag - acumular texto
            text_start = i
            while i < n and html_content[i] != '<':
                i += 1
            raw_text = html_content[text_start:i]

            stripped = raw_text.strip()
            if stripped and '__PROTECTED_' not in stripped and not stripped.startswith('___CKO_TR_'):
                idx = counter[0]
                counter[0] += 1
                placeholder = generate_placeholder(idx, "TEXT")
                text_map[placeholder] = stripped
                # Preservar whitespace ao redor
                leading = raw_text[:len(raw_text) - len(raw_text.lstrip())]
                trailing = raw_text[len(raw_text.rstrip()):]
                result.append(leading + placeholder + trailing)
            else:
                result.append(raw_text)

    return ''.join(result), text_map

# Atributos HTML cujo valor textual pode ser traduzido
TRANSLATABLE_ATTRS = {"title", "alt", "aria-label", "placeholder"}

def extract_translatable_attributes(html_content: str) -> tuple[str, dict]:
    """Extrai textos de atributos traduzíveis (title, alt, aria-label, placeholder)."""
    attr_map = {}
    counter = [0]

    for attr_name in TRANSLATABLE_ATTRS:
        # Regex: attr="texto"
        pattern = rf'({attr_name}=["\'])([^"\']*?)(["\'])'

        def make_replacer(aname):
            def replacer(m):
                prefix = m.group(1)
                text = m.group(2)
                suffix = m.group(3)
                if not text or not text.strip():
                    return m.group(0)
                if is_placeholder(text):
                    return m.group(0)
                idx = counter[0]
                counter[0] += 1
                placeholder = generate_placeholder(idx, "ATTR")
                attr_map[placeholder] = text.strip()
                return f'{prefix}{placeholder}{suffix}'
            return replacer

        html_content = re.sub(pattern, make_replacer(attr_name), html_content,
                              flags=re.DOTALL)

    return html_content, attr_map

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         APIs DE TRADUÇÃO                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def call_deepseek(texts: list[str], target_lang: str, context: str = "") -> Optional[dict]:
    """Traduz textos via DeepSeek API."""
    if not DEEPSEEK_KEY:
        return None

    try:
        prompt = _build_translation_prompt(texts, target_lang, context)

        data = json.dumps({
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "You are a professional medical/nursing translator. Translate exactly as requested. Return ONLY valid JSON, nothing else."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 8000,
            "response_format": {"type": "json_object"},
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_KEY}",
            },
            method="POST",
        )

        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT, context=ctx) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed

    except Exception as e:
        log.warning(f"DeepSeek falhou: {e}")
        return None

def call_openai(texts: list[str], target_lang: str, context: str = "") -> Optional[dict]:
    """Traduz textos via OpenAI API."""
    if not OPENAI_KEY:
        return None

    try:
        prompt = _build_translation_prompt(texts, target_lang, context)

        data = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a professional medical/nursing translator. Translate exactly as requested. Return ONLY valid JSON, nothing else."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 8000,
            "response_format": {"type": "json_object"},
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_KEY}",
            },
            method="POST",
        )

        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT, context=ctx) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed

    except Exception as e:
        log.warning(f"OpenAI falhou: {e}")
        return None

def _build_translation_prompt(texts: list[str], target_lang: str, context: str = "") -> str:
    """Constrói prompt de tradução com IDs."""
    lang_name = IDIOMA_MAP.get(target_lang, {}).get("nome", target_lang)

    items = []
    for i, text in enumerate(texts):
        items.append(f'  {{"id":"{i:06d}","text":{json.dumps(text, ensure_ascii=False)}}}')

    items_json = "[\n" + ",\n".join(items) + "\n]"

    prompt = f"""Translate these nursing/healthcare UI strings from Brazilian Portuguese to {lang_name}.

CONTEXT: Professional nursing website — calculadorasdeenfermagem.com.br
{context}

RULES:
- Adapt nursing terminology naturally for {lang_name}
- Preserve numbers, units, formulas exactly
- Return ONLY a JSON object with "translations" array
- Each translation must have "id" and "translation" fields
- Same number of translations as input strings
- No markdown, no explanations, no extra text

STRINGS TO TRANSLATE:
{items_json}

Return format:
{{"translations":[{{"id":"000000","translation":"..."}}, ...]}}"""

    return prompt

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    GERENCIADOR DE TRADUÇÃO POR LOTES                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def call_deepl(texts: list[str], target_lang: str, context: str = "") -> Optional[dict]:
    """Traduz textos via DeepL API."""
    if not DEEPL_KEY:
        return None

    try:
        # Mapear codigo de idioma para formato DeepL (PT → PT, EN → EN-US, etc.)
        deepl_lang = target_lang.upper()
        if target_lang == "en":
            deepl_lang = "EN-US"
        elif target_lang == "pt":
            deepl_lang = "PT-BR"

        # DeepL espera text= parametros separados
        params = urllib.parse.urlencode(
            [("text", t) for t in texts] +
            [("target_lang", deepl_lang), ("source_lang", "PT")]
        )

        data = params.encode("utf-8")
        req = urllib.request.Request(
            "https://api-free.deepl.com/v2/translate",
            data=data,
            headers={
                "Authorization": f"DeepL-Auth-Key {DEEPL_KEY}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )

        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT, context=ctx) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            # Converter resposta DeepL para formato padrao {translations: [{id, translation}]}
            translations = []
            for i, t in enumerate(result.get("translations", [])):
                translations.append({
                    "id": f"{i:06d}",
                    "translation": t.get("text", ""),
                })
            return {"translations": translations}

    except Exception as e:
        log.warning(f"DeepL falhou: {e}")
        return None


class BatchTranslator:
    """Gerencia traducao em lotes com intercalacao DeepSeek/OpenAI/DeepL."""

    # Ordem de rotacao: deepseek → openai → deepl
    API_ORDER = ["deepseek", "openai", "deepl"]

    def __init__(self, target_lang: str):
        self.target_lang = target_lang
        self.api_index = 0  # indice na API_ORDER
        self.stats = {"deepseek": 0, "openai": 0, "deepl": 0, "fallbacks": 0}

    def translate_batch(self, texts: list[str], context: str = "",
                        batch_num: int = 0, total_batches: int = 0) -> dict:
        """Traduz um lote de textos com retry e fallback entre 3 APIs."""
        primary = self.API_ORDER[self.api_index]
        self.api_index = (self.api_index + 1) % len(self.API_ORDER)

        if batch_num > 0:
            log.info(f"    Lote {batch_num}/{total_batches} — {len(texts)} strings — API: {primary}")

        for attempt in range(1, MAX_RETRIES + 1):
            if attempt > 1:
                log.info(f"    Tentativa {attempt}/{MAX_RETRIES}...")

            ts_start = time.time()
            result = self._try_api(primary, texts, context)
            ts_elapsed = time.time() - ts_start
            if result and self._validate_response(result, len(texts)):
                self.stats[primary] += 1
                if batch_num > 0:
                    log.info(f"    OK Lote {batch_num} via {primary} em {ts_elapsed:.1f}s")
                return result

            # Fallback: tentar as outras 2 APIs em ordem
            fallback_order = [a for a in self.API_ORDER if a != primary]
            for fb in fallback_order:
                log.info(f"    -> {primary} falhou ({ts_elapsed:.1f}s), tentando {fb}...")
                time.sleep(2)
                ts_start = time.time()
                result = self._try_api(fb, texts, context)
                ts_elapsed = time.time() - ts_start
                if result and self._validate_response(result, len(texts)):
                    self.stats[fb] += 1
                    self.stats["fallbacks"] += 1
                    if batch_num > 0:
                        log.info(f"    OK Lote {batch_num} via {fb} (fallback) em {ts_elapsed:.1f}s")
                    return result

            if attempt < MAX_RETRIES:
                log.info(f"    Aguardando {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)

        raise RuntimeError(f"Traducao falhou apos {MAX_RETRIES} tentativas.")

    def _try_api(self, api_name: str, texts: list[str], context: str) -> Optional[dict]:
        if api_name == "deepseek":
            return call_deepseek(texts, self.target_lang, context)
        elif api_name == "openai":
            return call_openai(texts, self.target_lang, context)
        elif api_name == "deepl":
            return call_deepl(texts, self.target_lang, context)
        return None

    def _validate_response(self, response: dict, expected_count: int) -> bool:
        """Valida resposta da API com verificacao rigorosa de IDs.
        Tolerancia: se diferenca <= 2, tenta casar por IDs."""
        if not response or "translations" not in response:
            log.warning("Resposta sem campo 'translations'.")
            return False
        translations = response["translations"]

        diff = len(translations) - expected_count
        if abs(diff) > 2:
            log.warning(f"Contagem muito divergente: esperado {expected_count}, obtido {len(translations)}")
            return False
        if diff != 0:
            log.warning(f"Diferenca de contagem: esperado {expected_count}, obtido {len(translations)} — tolerado")

        seen_ids = set()
        valid_translations = []
        for t in translations:
            if "id" not in t or "translation" not in t:
                continue
            if not t["translation"] or not t["translation"].strip():
                continue
            tid = t["id"]
            if tid in seen_ids:
                continue
            seen_ids.add(tid)
            valid_translations.append(t)

        # Se temos pelo menos expected_count itens validos, OK
        if len(valid_translations) < expected_count:
            log.warning(f"Itens validos insuficientes: {len(valid_translations)}/{expected_count}")
            return False

        # Atualizar a resposta para usar apenas itens validos
        response["translations"] = valid_translations
        return True

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                 FASE 1 — HEAD / SEO / METADADOS                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def process_html_lang(html_content: str, target_lang: str) -> str:
    """Ajusta <html lang="...">."""
    info = IDIOMA_MAP[target_lang]
    new_lang = info["lang"]
    html_content = re.sub(
        r'<html\s+lang="[^"]*"',
        f'<html lang="{new_lang}"',
        html_content,
        count=1,
    )
    return html_content

def process_title(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Traduz <title>."""
    match = re.search(r'<title>(.*?)</title>', html_content, re.DOTALL)
    if not match:
        return html_content
    original = match.group(1).strip()
    if not original:
        return html_content

    result = translator.translate_batch([original], "HTML title tag")
    translated = result["translations"][0]["translation"]

    html_content = html_content.replace(
        f"<title>{match.group(1)}</title>",
        f"<title>{translated}</title>",
    )
    return html_content

def process_meta_description(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Traduz meta description."""
    pattern = r'<meta\s+content="([^"]*)"\s+name="description"[^>]*>'
    match = re.search(pattern, html_content)
    if not match:
        return html_content

    original = match.group(1).strip()
    if not original:
        return html_content

    result = translator.translate_batch([original], "meta description")
    translated = result["translations"][0]["translation"]

    html_content = html_content.replace(
        f'content="{match.group(1)}"',
        f'content="{translated}"',
        1,
    )
    return html_content

def process_meta_keywords(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Traduz meta keywords."""
    pattern = r'<meta\s+content="([^"]*)"\s+name="keywords"[^>]*>'
    match = re.search(pattern, html_content)
    if not match:
        return html_content

    original = match.group(1).strip()
    if not original:
        return html_content

    result = translator.translate_batch([original], "meta keywords")
    translated = result["translations"][0]["translation"]

    html_content = html_content.replace(
        f'content="{match.group(1)}"',
        f'content="{translated}"',
        1,
    )
    return html_content

def process_og_locale(html_content: str, target_lang: str) -> str:
    """Ajusta og:locale."""
    info = IDIOMA_MAP[target_lang]
    new_locale = info["og_locale"]
    html_content = re.sub(
        r'(<meta\s+content=")[^"]*("\s+property="og:locale")',
        rf'\1{new_locale}\2',
        html_content,
    )
    return html_content

def process_og_meta(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Traduz og:title e og:description."""
    for prop in [("og:title", "Open Graph title"), ("og:description", "Open Graph description")]:
        pattern = rf'<meta\s+content="([^"]*)"\s+property="{prop[0]}"[^>]*>'
        match = re.search(pattern, html_content)
        if match:
            original = match.group(1).strip()
            if original:
                result = translator.translate_batch([original], prop[1])
                translated = result["translations"][0]["translation"]
                html_content = html_content.replace(
                    f'content="{match.group(1)}"',
                    f'content="{translated}"',
                    1,
                )

    return html_content

def process_twitter_meta(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Traduz twitter:title e twitter:description."""
    for name, context in [("twitter:title", "Twitter title"), ("twitter:description", "Twitter description")]:
        pattern = rf'<meta\s+content="([^"]*)"\s+name="{name}"[^>]*>'
        match = re.search(pattern, html_content)
        if match:
            original = match.group(1).strip()
            if original:
                result = translator.translate_batch([original], context)
                translated = result["translations"][0]["translation"]
                html_content = html_content.replace(
                    f'content="{match.group(1)}"',
                    f'content="{translated}"',
                    1,
                )
    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    PROCESSAMENTO DE SCHEMA.ORG                             ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def process_schema(html_content: str, target_lang: str, translator: BatchTranslator) -> str:
    """Processa Schema.org JSON-LD de forma cirurgica: extrai textos, traduz, substitui no JSON original."""
    schema_match = re.search(
        r'(<script\s+type="application/ld\+json">)(.*?)(</script>)',
        html_content, re.DOTALL
    )
    if not schema_match:
        return html_content

    prefix = schema_match.group(1)
    json_str = schema_match.group(2)
    suffix = schema_match.group(3)

    # Coletar textos traduziveis do JSON sem parse completo
    texts_to_translate = []
    text_positions = []

    # Encontrar strings dentro de propriedades traduziveis no JSON
    translatable_keys = ["name", "description", "headline", "alternativeHeadline",
                         "articleSection", "about", "text"]
    for key in translatable_keys:
        pattern = rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"'
        for m in re.finditer(pattern, json_str):
            val = m.group(1)
            if val.strip() and len(val) > 2:
                texts_to_translate.append(val)
                text_positions.append((m.start(1), m.end(1), m.group(0)))

    if not texts_to_translate:
        # Apenas adaptar URLs internas
        json_str = re.sub(
            r'"(https://www\.calculadorasdeenfermagem\.com\.br)(/[^"]*\.html)"',
            lambda m: f'"{m.group(1)}/{target_lang}{m.group(2)}"',
            json_str,
        )
        # Corrigir duplo segmento (ex: /pt/en/algo.html)
        for code in IDIOMA_MAP:
            json_str = json_str.replace(f"/{code}//{target_lang}/", f"/{target_lang}/")
        json_str = json_str.replace(f"//{target_lang}/", f"/{target_lang}/")
        return html_content.replace(schema_match.group(2), json_str)

    # Traduzir textos
    result = translator.translate_batch(texts_to_translate, "Schema.org structured data")
    translations = result["translations"]

    # Construir dicionario de substituicoes
    replace_map = {}
    for i, (start, end, full_match) in enumerate(text_positions):
        if i < len(translations):
            translated_val = translations[i]["translation"]
            # Escapar caracteres especiais para JSON
            translated_val = translated_val.replace('\\', '\\\\').replace('"', '\\"')
            old_val = json_str[start:end]
            replace_map[old_val] = translated_val

    # Aplicar substituicoes cirurgicas no texto JSON original
    for old_val, new_val in replace_map.items():
        json_str = json_str.replace(f'"{old_val}"', f'"{new_val}"', 1)

    # Adaptar URLs internas
    json_str = re.sub(
        r'"(https://www\.calculadorasdeenfermagem\.com\.br)(/[^"]*\.html)"',
        lambda m: f'"{m.group(1)}/{target_lang}{m.group(2)}"',
        json_str,
    )
    for code in IDIOMA_MAP:
        json_str = json_str.replace(f"/{code}//{target_lang}/", f"/{target_lang}/")
    json_str = json_str.replace(f"//{target_lang}/", f"/{target_lang}/")

    html_content = html_content.replace(schema_match.group(2), json_str)
    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    CANONICAL E HREFLANG                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

BASE_URL = "https://www.calculadorasdeenfermagem.com.br"

def adapt_url(url: str, target_lang: str) -> str:
    """Adapta URL interna para o idioma de destino."""
    if "calculadorasdeenfermagem.com.br" not in url:
        return url

    # Extrair o nome do arquivo da URL
    parsed = url.replace(BASE_URL, "")
    if target_lang == "pt":
        # Remover prefixo de idioma se existir
        for lang_code in IDIOMA_MAP:
            if parsed.startswith(f"/{lang_code}/"):
                parsed = parsed[len(f"/{lang_code}"):]
                break
        return f"{BASE_URL}{parsed}"
    else:
        # Adicionar prefixo de idioma
        for lang_code in IDIOMA_MAP:
            if parsed.startswith(f"/{lang_code}/"):
                parsed = parsed[len(f"/{lang_code}"):]
                break
        return f"{BASE_URL}/{target_lang}{parsed}"

def process_canonical(html_content: str, target_lang: str, filename: str) -> str:
    """Ajusta canonical para apontar para a versão traduzida."""
    new_url = f"{BASE_URL}/{target_lang}/{filename}"
    html_content = re.sub(
        r'<link\s+href="[^"]*"\s+rel="canonical"[^>]*>',
        f'<link href="{new_url}" rel="canonical"/>',
        html_content,
    )
    return html_content

def process_hreflang(html_content: str, target_lang: str, filename: str) -> str:
    """Reconstroi bloco hreflang com idioma de destino primeiro.
    Localiza o bloco com precisao: sequencia de links hreflang apos canonical."""

    # Construir novo bloco deterministico
    hreflang_lines = []
    dest_url = f"{BASE_URL}/{target_lang}/{filename}"
    pt_url = f"{BASE_URL}/{filename}"

    # 1. Idioma destino primeiro
    hreflang_lines.append(f'<link href="{dest_url}" hreflang="{target_lang}" rel="alternate"/>')
    # 2. pt-br
    hreflang_lines.append(f'<link href="{pt_url}" hreflang="pt-br" rel="alternate"/>')
    # 3. Demais idiomas em ordem alfabetica
    for code in sorted(IDIOMA_MAP.keys()):
        if code in (target_lang, "pt"):
            continue
        lang_url = f"{BASE_URL}/{code}/{filename}"
        hreflang_lines.append(f'<link href="{lang_url}" hreflang="{code}" rel="alternate"/>')
    # 4. x-default
    hreflang_lines.append(f'<link href="{pt_url}" hreflang="x-default" rel="alternate"/>')

    new_block = "\n".join(hreflang_lines)

    # Localizar bloco hreflang existente: links hreflang consecutivos
    # Procura apos canonical para ser especifico
    canonical_pos = html_content.find('rel="canonical"')
    if canonical_pos > 0:
        search_start = html_content.find('\n', canonical_pos)
        if search_start == -1:
            search_start = canonical_pos + 50
        remaining = html_content[search_start:]
        hreflang_pattern = r'((?:<link[^>]*hreflang="[^"]*"[^>]*>\s*)+)'
        match = re.search(hreflang_pattern, remaining)
        if match:
            html_content = html_content.replace(match.group(1), new_block + "\n")

    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    LINKS INTERNOS                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def process_internal_links(html_content: str, target_lang: str) -> str:
    """Adapta links internos para o idioma de destino.
    Apenas converte links para paginas .html na raiz que nao estao em pasta de idioma."""
    lang_codes = set(IDIOMA_MAP.keys())

    def should_adapt(href: str) -> bool:
        if not href.startswith("/"):
            return False
        if href.startswith("//"):
            return False
        if href.startswith("/#"):
            return False
        # Ja esta em uma pasta de idioma
        if any(href.startswith(f"/{code}/") for code in lang_codes):
            return False
        # Apenas .html na raiz
        if not href.endswith(".html"):
            return False
        # Nao sao recursos web
        skip_patterns = ['/fonts/', '/img/', '/public/', '/src/', '/assets/', '/biblioteca/', '/blog/']
        if any(href.startswith(p) for p in skip_patterns):
            return False
        return True

    def adapt_link(match):
        full = match.group(0)
        href = match.group(1)
        if should_adapt(href):
            new_href = f"/{target_lang}{href}"
            return full.replace(f'href="{href}"', f'href="{new_href}"')
        return full

    # Links em href="..."
    html_content = re.sub(
        r'href="(/[^"]*\.html)"',
        adapt_link,
        html_content,
    )

    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    FONTES ESPECIAIS                                        ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def process_special_fonts(html_content: str, target_lang: str) -> str:
    """Substitui fontes para idiomas especiais (ar, hi, zh, ja, ko).
    Substitui cada <link> de fonte individualmente, preservando a contagem."""
    info = IDIOMA_MAP[target_lang]
    font_family = info.get("font_family")

    if not font_family or font_family not in SPECIAL_FONTS:
        return html_content

    font_config = SPECIAL_FONTS[font_family]

    # Substituir <style id="critical-fonts">
    html_content = re.sub(
        r'<style id="critical-fonts">.*?</style>',
        font_config["css"],
        html_content,
        count=1,
        flags=re.DOTALL,
    )

    # Substituir cada link de fonte individualmente, mantendo o mesmo numero
    preload_links = font_config["preloads"].strip().split("\n")

    # Regex para encontrar todos os <link> de preload de fonte
    font_link_pattern = re.compile(
        r'<link[^>]*href="[^"]*/fonts/(?:inter|nunito)/[^"]*"[^>]*>\s*'
    )
    existing_links = font_link_pattern.findall(html_content)

    if existing_links:
        # Substituir apenas o primeiro link, depois remover os extras
        first_pos = html_content.find(existing_links[0])
        last_pos = html_content.find(existing_links[-1]) + len(existing_links[-1])

        # Construir novo bloco com o mesmo numero de links
        replacement_links = []
        for i in range(len(existing_links)):
            if i < len(preload_links):
                replacement_links.append(preload_links[i])
            else:
                replacement_links.append("")

        new_block = "\n".join(l for l in replacement_links if l) + "\n"
        html_content = html_content[:first_pos] + new_block + html_content[last_pos:]

    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    FOOTER INTERNACIONAL                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

FOOTER_INTERNATIONAL = """<div id="footer-placeholder"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
setTimeout(() => {
fetch("footer.html")
.then((response) => response.text())
.then((data) => {
document.getElementById("footer-placeholder").innerHTML = data;
});
}, 150);
});
</script>"""

def process_footer(html_content: str) -> str:
    """Substitui footer brasileiro pelo footer internacional."""
    # Padrão do footer brasileiro
    footer_pattern = r'<div id="footer-placeholder"[^>]*></div>\s*<script>\s*document\.addEventListener\("DOMContentLoaded".*?carregarTraducoes.*?</script>'

    match = re.search(footer_pattern, html_content, re.DOTALL)
    if match:
        html_content = html_content.replace(match.group(0), FOOTER_INTERNATIONAL)

    return html_content


# ============================================================
# MOTOR DE TRADUCAO DE JAVASCRIPT INLINE
# Origem funcional: novo_tradutor_massivo_js_.py
# Regra: preservar integralmente a logica de extracao,
# protecao, traducao e reinsercao ja validada.
# ============================================================

JS_PROTECTED_LINES = [
    "const badge = document.getElementById(`badge_${item.id}`);",
    "const badge = document.getElementById(`badge_${id}`);",
    "const bar = document.getElementById(`bar_${item.id}`);",
]

TERMO_SELECIONE_PT = "Selecione..."


def js_extract_inline_scripts(html_content: str) -> list:
    """Extrai todos os <script> inline (sem src=) do HTML.
    Retorna lista ordenada com posicoes exatas.
    Pula JSON-LD, scripts de dados e scripts do footer."""
    pattern = re.compile(
        r'(<script\b[^>]*>)(.*?)(</script>)',
        re.IGNORECASE | re.DOTALL,
    )
    results = []
    for m in pattern.finditer(html_content):
        abertura = m.group(1)
        conteudo = m.group(2)
        fecha = m.group(3)
        abertura_lower = abertura.lower()
        if 'src=' in abertura_lower:
            continue
        if re.search(r'\btype=["\'](?:application/ld\+json|application/json)["\']', abertura_lower):
            continue
        if 'footer-placeholder' in conteudo or 'footer.html' in conteudo:
            continue
        results.append({
            "idx_inicio": m.start(),
            "idx_fim": m.end(),
            "abertura": abertura,
            "conteudo": conteudo,
            "fecha_tag": fecha,
        })
    return results


def _skip_js_quoted(js_code: str, start: int, quote: str) -> int:
    """Retorna a posicao seguinte ao fim de uma string JS simples/dupla."""
    i = start + 1
    while i < len(js_code):
        if js_code[i] == '\\':
            i += 2
            continue
        if js_code[i] == quote:
            return i + 1
        i += 1
    return len(js_code)


def _scan_js_templates(js_code: str) -> tuple[list, list]:
    """Localiza template literals e seus trechos literais, inclusive aninhados.

    Retorna (regioes_completas, templates), onde cada template contem somente
    os intervalos fora de ${...}. Esses intervalos nunca se sobrepoem.
    """
    regions = []
    templates = []

    def skip_comment(i: int) -> int:
        if js_code.startswith('//', i):
            end = js_code.find('\n', i + 2)
            return len(js_code) if end == -1 else end + 1
        if js_code.startswith('/*', i):
            end = js_code.find('*/', i + 2)
            return len(js_code) if end == -1 else end + 2
        return i

    def scan_expression(i: int) -> int:
        depth = 1
        while i < len(js_code):
            ch = js_code[i]
            if ch in ('"', "'"):
                i = _skip_js_quoted(js_code, i, ch)
                continue
            if ch == '`':
                i = scan_template(i)
                continue
            if js_code.startswith('//', i) or js_code.startswith('/*', i):
                i = skip_comment(i)
                continue
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return i + 1
            i += 1
        return len(js_code)

    def scan_template(start: int) -> int:
        i = start + 1
        literal_start = i
        segments = []
        while i < len(js_code):
            if js_code[i] == '\\':
                i += 2
                continue
            if js_code[i] == '`':
                if literal_start < i:
                    segments.append((literal_start, i))
                end = i + 1
                regions.append((start, end))
                templates.append({"pos": (start, end), "segments": segments})
                return end
            if js_code.startswith('${', i):
                if literal_start < i:
                    segments.append((literal_start, i))
                i = scan_expression(i + 2)
                literal_start = i
                continue
            i += 1

        regions.append((start, len(js_code)))
        templates.append({"pos": (start, len(js_code)), "segments": segments})
        return len(js_code)

    i = 0
    while i < len(js_code):
        ch = js_code[i]
        if ch in ('"', "'"):
            i = _skip_js_quoted(js_code, i, ch)
            continue
        if js_code.startswith('//', i) or js_code.startswith('/*', i):
            i = skip_comment(i)
            continue
        if ch == '`':
            i = scan_template(i)
            continue
        i += 1

    return sorted(regions), templates


def _is_translatable_js_text(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < 3 or not re.search(r'[A-Za-zÀ-ÿ]', stripped):
        return False
    if stripped in {'use strict', 'application/json', 'application/ld+json'}:
        return False
    if stripped.startswith(('/', '#', '.', 'data-')) or '://' in stripped:
        return False
    if stripped.endswith(('.html', '.js', '.css')) or '.com' in stripped or '.br' in stripped:
        return False
    if re.search(r'\b(?:rgba?|hsla?|px|rem|em|deg)\s*\(?', stripped, re.IGNORECASE):
        return False
    if re.match(r'^(?:scale|rotate|translate)[XYZ3d]*\s*\(', stripped, re.IGNORECASE):
        return False
    if re.fullmatch(r'[A-Za-z0-9_.:/#%+-]+', stripped) and re.search(r'[_./#%+-]', stripped):
        return False
    # Identificadores, eventos, valores CSS e chaves tecnicas de uma palavra.
    # Termos de interface iniciados por maiuscula continuam traduziveis.
    if re.fullmatch(r'[a-zà-ÿ][\wÀ-ÿ-]*', stripped):
        return False
    if re.fullmatch(r'[A-Z0-9_]{2,}', stripped) and stripped not in {'NORMAL', 'ANORMAL'}:
        return False
    if re.search(r'\b(function|const|let|var|return|if|else|for|while)\b', stripped):
        return False
    return True


def _visible_html_text_spans(text: str, base_offset: int = 0,
                             initial_in_tag: bool = False) -> tuple[list, bool]:
    """Extrai apenas texto visivel; tags e atributos permanecem intocados."""
    spans = []
    in_tag = initial_in_tag
    text_start = None

    for i, ch in enumerate(text):
        if ch == '<' and not in_tag:
            if text_start is not None and text_start < i:
                spans.append((base_offset + text_start, base_offset + i))
            text_start = None
            in_tag = True
        elif ch == '>' and in_tag:
            in_tag = False
            text_start = i + 1
        elif not in_tag and text_start is None:
            text_start = i

    if not in_tag and text_start is not None and text_start < len(text):
        spans.append((base_offset + text_start, base_offset + len(text)))
    return spans, in_tag


def js_extract_translatable_strings(js_code: str, id_prefix: str = "JS") -> tuple:
    """Extrai textos JS sem sobrepor codigo, tags HTML ou interpolacoes."""
    strings_para_traduzir = {}
    mapeamento = []
    contador = 0
    template_regions, templates = _scan_js_templates(js_code)

    def add_mapping(start: int, end: int, tipo: str,
                    delimitador: str = ""):
        nonlocal contador
        raw = js_code[start:end]
        leading = len(raw) - len(raw.lstrip())
        trailing = len(raw) - len(raw.rstrip())
        core_start = start + leading
        core_end = end - trailing if trailing else end
        text = js_code[core_start:core_end]
        if not _is_translatable_js_text(text):
            return
        id_str = f"{id_prefix}_{contador:06d}"
        contador += 1
        strings_para_traduzir[id_str] = text
        mapeamento.append({
            "id": id_str,
            "delimitador": delimitador,
            "tipo": tipo,
            "pos": (core_start, core_end),
        })

    # Template literals: traduzir somente texto visivel fora de ${...}.
    for template in templates:
        start, end = template["pos"]
        raw_template = js_code[start + 1:end - 1].lstrip()
        # O laudo HTML completo contem CSS e JS embutidos; permanece protegido.
        if raw_template.lower().startswith(('<!doctype', '<html')):
            continue
        in_tag = False
        has_html = any('<' in js_code[s:e] or '>' in js_code[s:e]
                       for s, e in template["segments"])
        for seg_start, seg_end in template["segments"]:
            segment = js_code[seg_start:seg_end]
            if has_html:
                spans, in_tag = _visible_html_text_spans(segment, seg_start, in_tag)
                for text_start, text_end in spans:
                    add_mapping(text_start, text_end, "template_text", "`")
            else:
                add_mapping(seg_start, seg_end, "template_text", "`")

    def inside_template(pos: int) -> bool:
        return any(start <= pos < end for start, end in template_regions)

    # Strings simples/duplas fora dos templates.
    padrao_string = re.compile(
        r'"((?:[^"\\]|\\.)*)"|\'((?:[^\'\\]|\\.)*)\''
    )
    for match in padrao_string.finditer(js_code):
        match_start = match.start(0)
        if match.group(1) is not None:
            delimitador = '"'
            conteudo = match.group(1)
            content_start = match.start(1)
        else:
            delimitador = "'"
            conteudo = match.group(2)
            content_start = match.start(2)
        if inside_template(match_start):
            continue
        if '<' in conteudo and '>' in conteudo:
            spans, _ = _visible_html_text_spans(conteudo, content_start)
            for text_start, text_end in spans:
                add_mapping(text_start, text_end, "quoted_text", delimitador)
        elif _is_translatable_js_text(conteudo):
            id_str = f"{id_prefix}_{contador:06d}"
            contador += 1
            strings_para_traduzir[id_str] = conteudo
            mapeamento.append({
                "id": id_str,
                "delimitador": delimitador,
                "tipo": "string",
                "pos": (match_start, match.end(0)),
            })

    return mapeamento, strings_para_traduzir


def js_reinsert_translations(js_code: str, mapeamento: list, traducoes: dict) -> str:
    """Reinsere traducoes no codigo JS, substituindo do final para preservar offsets."""
    sorted_map = sorted(mapeamento, key=lambda x: x["pos"][0], reverse=True)
    for item in sorted_map:
        if item["id"] not in traducoes:
            continue
        texto_trad = traducoes[item["id"]]
        delimitador = item.get("delimitador", "")
        texto_trad = texto_trad.replace('\r', ' ').replace('\n', ' ')
        if delimitador:
            texto_trad = re.sub(rf'(?<!\\){re.escape(delimitador)}',
                                rf'\\{delimitador}', texto_trad)
        if delimitador == '`':
            texto_trad = texto_trad.replace('${', r'\${')
        if item["tipo"] == "string":
            novo = f"{delimitador}{texto_trad}{delimitador}"
        else:
            novo = texto_trad
        start, end = item["pos"]
        js_code = js_code[:start] + novo + js_code[end:]
    return js_code


def js_restore_protected_lines(original_js: str, translated_js: str) -> str:
    """Restaura linhas protegidas no JS traduzido usando a versao original pt-BR."""
    resultado = translated_js
    padroes = [
        re.compile(r'const\s+badge\s*=\s*document\.getElementById\s*\(\s*`badge_\$\{item\.id\}`\s*\)\s*;'),
        re.compile(r'const\s+badge\s*=\s*document\.getElementById\s*\(\s*`badge_\$\{id\}`\s*\)\s*;'),
        re.compile(r'const\s+bar\s*=\s*document\.getElementById\s*\(\s*`bar_\$\{item\.id\}`\s*\)\s*;'),
    ]
    substituicoes = [
        (padroes[0], JS_PROTECTED_LINES[0]),
        (padroes[1], JS_PROTECTED_LINES[1]),
        (padroes[2], JS_PROTECTED_LINES[2]),
    ]
    for padrao, original_pt in substituicoes:
        if padrao.search(resultado):
            resultado = padrao.sub(original_pt, resultado)
    return resultado


def js_fix_corrupted_templates(js_code: str) -> str:
    """Corrige corrupcoes conhecidas em template literals."""
    js_code = re.sub(r'\?\s*"\s*`', '? `', js_code)
    js_code = re.sub(r'\?\s*"[^`]*`\s*`', '? `', js_code)
    return js_code


def translate_js_inline(html_content: str, target_lang: str,
                        translator: BatchTranslator) -> tuple:
    """Traduz todas as strings dentro de <script> inline no HTML.
    Retorna: (html_modificado, relatorio_js)."""
    report = {
        "scripts_encontrados": 0,
        "strings_encontradas": 0,
        "strings_enviadas": 0,
        "strings_traduzidas": 0,
        "strings_reinseridas": 0,
        "strings_perdidas": 0,
        "erros_estrutura": 0,
        "passed": True,
    }

    scripts = js_extract_inline_scripts(html_content)
    report["scripts_encontrados"] = len(scripts)
    if not scripts:
        return html_content, report

    all_strings = {}
    all_mappings = {}
    for idx, script in enumerate(scripts):
        mapeamento, strings_dict = js_extract_translatable_strings(
            script["conteudo"], id_prefix=f"JS{idx}"
        )
        if strings_dict:
            all_mappings[idx] = mapeamento
            all_strings.update(strings_dict)

    report["strings_encontradas"] = len(all_strings)
    if not all_strings:
        return html_content, report

    sorted_items = sorted(all_strings.items(), key=lambda x: x[0])
    texts = [item[1] for item in sorted_items]
    ids_list = [item[0] for item in sorted_items]

    total_batches = (len(texts) + MAX_STRINGS_PER_BATCH - 1) // MAX_STRINGS_PER_BATCH
    report["strings_enviadas"] = len(texts)
    traducoes = {}

    for i in range(0, len(texts), MAX_STRINGS_PER_BATCH):
        batch_num = i // MAX_STRINGS_PER_BATCH + 1
        batch_texts = texts[i:i + MAX_STRINGS_PER_BATCH]
        batch_ids = ids_list[i:i + MAX_STRINGS_PER_BATCH]
        result = translator.translate_batch(
            batch_texts,
            f"JavaScript inline batch {batch_num}/{total_batches}",
            batch_num=batch_num,
            total_batches=total_batches,
        )
        for trans in result["translations"]:
            tid = trans["id"]
            t_idx = int(tid)
            if t_idx < len(batch_ids):
                traducoes[batch_ids[t_idx]] = trans["translation"]

    report["strings_traduzidas"] = len(traducoes)

    html_modificado = html_content
    for idx in sorted(all_mappings.keys(), reverse=True):
        script = scripts[idx]
        novo_js = js_reinsert_translations(script["conteudo"], all_mappings[idx], traducoes)
        novo_js = js_restore_protected_lines(script["conteudo"], novo_js)
        novo_js = js_fix_corrupted_templates(novo_js)
        novo_bloco = f"{script['abertura']}{novo_js}{script['fecha_tag']}"
        html_modificado = (
            html_modificado[:script["idx_inicio"]]
            + novo_bloco
            + html_modificado[script["idx_fim"]:]
        )

    report["strings_reinseridas"] = report["strings_traduzidas"]
    remaining_ids = set(all_strings.keys()) - set(traducoes.keys())
    report["strings_perdidas"] = len(remaining_ids)
    if remaining_ids:
        report["passed"] = False

    scripts_after = js_extract_inline_scripts(html_modificado)
    if len(scripts_after) != len(scripts):
        report["erros_estrutura"] += 1
        report["passed"] = False

    return html_modificado, report


def audit_js_preservation(original_html: str, translated_html: str) -> dict:
    """Audita preservacao dos scripts inline: integridade estrutural + sintaxe JS."""
    issues = []
    scripts_orig = js_extract_inline_scripts(original_html)
    scripts_trans = js_extract_inline_scripts(translated_html)

    if len(scripts_orig) != len(scripts_trans):
        issues.append(f"Qtd scripts: original={len(scripts_orig)}, traduzido={len(scripts_trans)}")
        return {"passed": False, "issues": issues}

    for i, (so, st) in enumerate(zip(scripts_orig, scripts_trans)):
        if so["abertura"] != st["abertura"]:
            issues.append(f"Script {i}: abertura alterada")
        elif len(so["conteudo"]) < 20 and so["conteudo"] != st["conteudo"]:
            issues.append(f"Script {i}: conteudo alterado em script pequeno")

        # Validar sintaxe JavaScript do script traduzido
        js_syntax_issues = validate_js_syntax(st["conteudo"])
        for js_issue in js_syntax_issues:
            issues.append(f"Script {i} - sintaxe JS: {js_issue}")

    return {"passed": len(issues) == 0, "issues": issues}


def validate_js_syntax(js_code: str) -> list:
    """Valida sintaxe JavaScript com Node.js, sem executar o codigo."""
    issues = []
    tmp_path = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', encoding='utf-8', delete=False) as tmp:
            tmp.write(js_code)
            tmp_path = tmp.name
        result = subprocess.run(
            ["node", "--check", tmp_path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
        )
        if result.returncode != 0:
            error_msg = (result.stderr or result.stdout or "erro de sintaxe").strip()[:500]
            issues.append(f"Node.js: {error_msg}")
    except FileNotFoundError:
        log.warning("Node.js nao encontrado; validacao sintatica JS completa ignorada.")
    except subprocess.TimeoutExpired:
        issues.append("Node.js excedeu 15s ao validar o script")
    except OSError as exc:
        issues.append(f"Falha ao validar JavaScript: {exc}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    return issues


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                 FASE 2 — TRADUÇÃO DO CORPO HTML                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def translate_body_texts(html_content: str, target_lang: str, translator: BatchTranslator,
                         text_map: dict, attr_map: dict) -> str:
    """Traduz textos do corpo HTML em lotes e reinsere."""

    # Combinar todos os textos
    all_texts = {}
    all_texts.update(text_map)
    all_texts.update(attr_map)

    if not all_texts:
        return html_content

    # Ordenar por placeholder para processamento determinístico
    sorted_items = sorted(all_texts.items(), key=lambda x: x[0])
    texts = [item[1] for item in sorted_items]
    placeholders = [item[0] for item in sorted_items]

    # Dividir em lotes
    total_batches = (len(texts) + MAX_STRINGS_PER_BATCH - 1) // MAX_STRINGS_PER_BATCH
    translation_results = {}
    for i in range(0, len(texts), MAX_STRINGS_PER_BATCH):
        batch_num = i // MAX_STRINGS_PER_BATCH + 1
        batch_texts = texts[i:i + MAX_STRINGS_PER_BATCH]
        batch_placeholders = placeholders[i:i + MAX_STRINGS_PER_BATCH]

        result = translator.translate_batch(
            batch_texts,
            f"Body text batch {batch_num}/{total_batches}",
            batch_num=batch_num,
            total_batches=total_batches,
        )

        for trans in result["translations"]:
            idx = int(trans["id"])
            if idx < len(batch_placeholders):
                translation_results[batch_placeholders[idx]] = trans["translation"]

    # Reinserir traduções
    for placeholder, translation in translation_results.items():
        html_content = html_content.replace(placeholder, translation)

    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    AUDITORIA ESTRUTURAL                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def build_structural_signature(html_content: str) -> list:
    """Gera assinatura estrutural hierarquica do HTML.
    Cada elemento: (nivel, tag_name, attrs_resumo).
    Ignora texto interno para nao ser afetado pela traducao."""
    # Tags escritas dentro de strings JavaScript/CSS nao fazem parte da arvore
    # HTML real e nao podem entrar na contagem estrutural.
    html_content = re.sub(
        r'(<script\b[^>]*>).*?(</script>)',
        r'\1\2',
        html_content,
        flags=re.IGNORECASE | re.DOTALL,
    )
    html_content = re.sub(
        r'(<style\b[^>]*>).*?(</style>)',
        r'\1\2',
        html_content,
        flags=re.IGNORECASE | re.DOTALL,
    )
    sig = []
    tokens = re.split(r'(</?\w+[^>]*>)', html_content)
    stack = []

    for token in tokens:
        token = token.strip()
        if not token:
            continue

        if token.startswith('</'):
            tag_match = re.match(r'</(\w+)', token)
            if tag_match:
                tag = tag_match.group(1).lower()
                if stack and stack[-1] == tag:
                    stack.pop()
            continue

        if token.startswith('<'):
            tag_match = re.match(r'<(\w+)([^>]*?)/?>$', token)
            if tag_match:
                tag = tag_match.group(1).lower()
                attrs_str = tag_match.group(2)
                id_match = re.search(r'\bid=["\']([^"\']+)["\']', attrs_str)
                class_match = re.search(r'\bclass=["\']([^"\']+)["\']', attrs_str)
                attrs_resumo = ""
                if id_match:
                    attrs_resumo += f"#{id_match.group(1)}"
                if class_match:
                    classes = class_match.group(1).split()[:2]
                    attrs_resumo += f".{'.'.join(classes)}"
                # Capturar href para <link> (permite identificar fontes via caminho /fonts/)
                if tag == 'link':
                    href_match = re.search(r'\bhref=["\']([^"\']+)["\']', attrs_str)
                    if href_match:
                        href = href_match.group(1)
                        if len(href) > 80:
                            href = href[:77] + '...'
                        attrs_resumo += f" href={href}"
                if not attrs_resumo:
                    attrs_resumo = "-"

                nivel = len(stack)
                sig.append((nivel, tag, attrs_resumo))

                self_closing = token.endswith('/>')
                void_tags = {'meta', 'link', 'img', 'br', 'hr', 'input', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'}
                if not self_closing and tag not in void_tags:
                    stack.append(tag)

    return sig


def compare_html_structure(original: str, translated: str) -> dict:
    """Compara a estrutura esperada com o HTML depois da traducao textual."""
    issues = []

    sig_orig = build_structural_signature(original)
    sig_trans = build_structural_signature(translated)

    from collections import Counter
    orig_counts = Counter(s[1] for s in sig_orig)
    trans_counts = Counter(s[1] for s in sig_trans)

    for tag in orig_counts:
        diff = orig_counts[tag] - trans_counts.get(tag, 0)
        if diff > 0:
            issues.append(f"Tag <{tag}>: faltando {diff} (original={orig_counts[tag]}, traduzido={trans_counts.get(tag, 0)})")
        elif diff < 0:
            issues.append(f"Tag <{tag}>: extra {-diff} (original={orig_counts[tag]}, traduzido={trans_counts.get(tag, 0)})")

    if len(sig_orig) != len(sig_trans):
        issues.append(f"Contagem de elementos: original={len(sig_orig)}, traduzido={len(sig_trans)}")
    else:
        diferencas = 0
        for i, (a, b) in enumerate(zip(sig_orig, sig_trans)):
            if a != b:
                diferencas += 1
                if diferencas <= 3:
                    issues.append(f"Divergencia estrutural na posicao {i}: esperado {a}, obtido {b}")
        if diferencas > 0:
            issues.append(f"Total de divergencias estruturais: {diferencas}")

    if PLACEHOLDER_PREFIX in translated:
        remaining = re.findall(rf'{re.escape(PLACEHOLDER_PREFIX)}\w+_\d+___', translated)
        if remaining:
            issues.append(f"Placeholders nao restaurados: {len(remaining)}")

    if '__PROTECTED_' in translated:
        remaining_p = re.findall(r'__PROTECTED_\w+_\d+__', translated)
        if remaining_p:
            issues.append(f"Blocos protegidos nao restaurados: {len(remaining_p)}")

    orig_scripts = re.findall(r'<script[^>]*>', original)
    trans_scripts = re.findall(r'<script[^>]*>', translated)
    if len(orig_scripts) != len(trans_scripts):
        issues.append(f"Scripts: original={len(orig_scripts)}, traduzido={len(trans_scripts)}")

    return {
        "passed": len(issues) == 0,
        "issues": issues,
        "elementos_original": len(sig_orig),
        "elementos_traduzido": len(sig_trans),
        "divergencias_estruturais": len([1 for a, b in zip(sig_orig, sig_trans) if a != b]) if len(sig_orig) == len(sig_trans) else -1,
    }

def audit_seo(html_content: str, target_lang: str, filename: str) -> dict:
    """Audita elementos de SEO."""
    issues = []

    # Lang
    lang_match = re.search(r'<html\s+lang="([^"]*)"', html_content)
    expected_lang = IDIOMA_MAP[target_lang]["lang"]
    if lang_match and lang_match.group(1) != expected_lang:
        issues.append(f"lang: esperado {expected_lang}, obtido {lang_match.group(1)}")

    # Canonical
    canonical_match = re.search(r'<link\s+href="([^"]*)"\s+rel="canonical"', html_content)
    expected_canonical = f"{BASE_URL}/{target_lang}/{filename}"
    if canonical_match and canonical_match.group(1) != expected_canonical:
        issues.append(f"canonical: esperado {expected_canonical}, obtido {canonical_match.group(1)}")

    # Title não vazio
    title_match = re.search(r'<title>(.*?)</title>', html_content, re.DOTALL)
    if title_match and not title_match.group(1).strip():
        issues.append("Title vazio")

    return {"passed": len(issues) == 0, "issues": issues}

def audit_footer(html_content: str) -> dict:
    """Audita footer internacional."""
    issues = []

    if 'carregarTraducoes' in html_content:
        issues.append("Footer ainda contém carregarTraducoes (pt)")

    if 'fetch("footer.html")' not in html_content and "fetch('footer.html')" not in html_content:
        issues.append("Footer não usa fetch('footer.html')")

    return {"passed": len(issues) == 0, "issues": issues}

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    CORREÇÃO AUTOMÁTICA                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def auto_repair(html_content: str, target_lang: str, filename: str, audit_results: dict) -> str:
    """Tenta corrigir problemas encontrados na auditoria."""
    repaired = html_content

    for category, result in audit_results.items():
        if result.get("passed", True):
            continue
        for issue in result.get("issues", []):
            log.info(f"Tentando corrigir: {issue}")

            if "lang:" in issue:
                expected_lang = IDIOMA_MAP[target_lang]["lang"]
                repaired = re.sub(
                    r'<html\s+lang="[^"]*"',
                    f'<html lang="{expected_lang}"',
                    repaired,
                    count=1,
                )

            if "canonical:" in issue:
                expected_canonical = f"{BASE_URL}/{target_lang}/{filename}"
                repaired = re.sub(
                    r'<link\s+href="[^"]*"\s+rel="canonical"[^>]*>',
                    f'<link href="{expected_canonical}" rel="canonical"/>',
                    repaired,
                )

            if "Footer ainda contém carregarTraducoes" in issue:
                repaired = process_footer(repaired)

    return repaired

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    FLUXO PRINCIPAL DE TRADUÇÃO                             ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def translate_file(filename: str, target_lang: str) -> dict:
    """Traduz um arquivo HTML completo para o idioma de destino."""
    report = {
        "arquivo": filename,
        "idioma": target_lang,
        "inicio": datetime.now().isoformat(),
        "status": "INICIADO",
        "strings_traduzidas": 0,
        "lotes": 0,
        "deepseek": 0,
        "openai": 0,
        "deepl": 0,
        "fallbacks": 0,
        "correcoes": 0,
        "auditoria": "PENDENTE",
        "publicacao": "NÃO REALIZADA",
    }

    source_path = ROOT / filename
    dest_dir = ROOT / target_lang
    dest_path = dest_dir / filename

    try:
        validate_source(source_path)
    except (FileNotFoundError, PermissionError, ValueError) as e:
        report["status"] = f"ERRO: {e}"
        return report

    log.info(f"{'='*60}")
    log.info(f"Traduzindo: {filename} → {target_lang} ({IDIOMA_MAP[target_lang]['nome']})")
    log.info(f"{'='*60}")

    # 1. Ler HTML original
    log.info(f"[1/20] Lendo arquivo original: {source_path}")
    with open(source_path, "r", encoding="utf-8") as f:
        original_html = f.read()
    log.info(f"       {len(original_html):,} caracteres lidos.")

    html_content = original_html

    # 2. Criar tradutor
    translator = BatchTranslator(target_lang)

    # ═══ FASE 1: HEAD / SEO ═══
    log.info("═════ FASE 1/2: Processando HEAD / SEO ═════")

    log.info("[2/20] Ajustando <html lang>...")
    html_content = process_html_lang(html_content, target_lang)
    log.info("[3/20] Ajustando canonical...")
    html_content = process_canonical(html_content, target_lang, filename)
    log.info("[4/20] Reconstruindo bloco hreflang (18 idiomas)...")
    html_content = process_hreflang(html_content, target_lang, filename)
    log.info("[5/20] Ajustando og:locale...")
    html_content = process_og_locale(html_content, target_lang)

    log.info("[6/20] Traduzindo <title>...")
    html_content = process_title(html_content, target_lang, translator)
    log.info("[7/20] Traduzindo meta description...")
    html_content = process_meta_description(html_content, target_lang, translator)
    log.info("[8/20] Traduzindo meta keywords...")
    html_content = process_meta_keywords(html_content, target_lang, translator)
    log.info("[9/20] Traduzindo Open Graph (og:title, og:description)...")
    html_content = process_og_meta(html_content, target_lang, translator)
    log.info("[10/20] Traduzindo Twitter Cards...")
    html_content = process_twitter_meta(html_content, target_lang, translator)
    log.info("[11/20] Processando Schema.org JSON-LD...")
    html_content = process_schema(html_content, target_lang, translator)

    log.info("[12/20] Adaptando links internos...")
    html_content = process_internal_links(html_content, target_lang)

    log.info("[13/20] Verificando fontes especiais...")
    html_content = process_special_fonts(html_content, target_lang)

    log.info("[14/20] Substituindo footer (PT -> internacional)...")
    html_content = process_footer(html_content)

    # Referencia estrutural apos todas as mudancas intencionais de idioma.
    # A traducao de textos/JS nao pode alterar esta estrutura.
    structural_reference = html_content

    # ═══ FASE JS INLINE ═══
    log.info("═════ TRADUCAO DE JAVASCRIPT INLINE ═════")
    log.info("[15/20] Extraindo e traduzindo strings em <script> inline...")
    html_content, js_report = translate_js_inline(html_content, target_lang, translator)
    log.info(f"       Scripts: {js_report['scripts_encontrados']}, "
             f"Strings JS: {js_report['strings_encontradas']} encontradas, "
             f"{js_report['strings_traduzidas']} traduzidas, "
             f"{js_report['strings_perdidas']} perdidas.")
    report["js_report"] = js_report

    # ═══ FASE 2: CORPO HTML ═══
    log.info("═════ FASE 2/2: Traduzindo corpo HTML ═════")

    log.info("[16/20] Protegendo blocos tecnicos (scripts, styles, SVGs, comentarios)...")
    html_content, protected, reverse_map = protect_html_blocks(html_content)
    log.info(f"       {len(protected)} blocos protegidos.")

    log.info("[17/20] Extraindo textos de atributos (title, alt, aria-label, placeholder)...")
    html_content, attr_map = extract_translatable_attributes(html_content)
    log.info(f"       {len(attr_map)} atributos extraidos.")

    log.info("[18/20] Extraindo textos do corpo HTML...")
    html_content, text_map = extract_text_nodes(html_content)

    total_texts = len(text_map) + len(attr_map)
    log.info(f"       Total de textos a traduzir: {total_texts} (body: {len(text_map)}, attrs: {len(attr_map)})")
    report["strings_traduzidas"] = total_texts

    log.info("[19/20] Enviando textos para traducao via API (DeepSeek <-> OpenAI)...")
    html_content = translate_body_texts(
        html_content, target_lang, translator, text_map, attr_map
    )

    log.info("[20/20] Restaurando blocos protegidos...")
    html_content = restore_protected_blocks(html_content, reverse_map)
    report["deepseek"] = translator.stats["deepseek"]
    report["openai"] = translator.stats["openai"]
    report["deepl"] = translator.stats["deepl"]
    report["fallbacks"] = translator.stats["fallbacks"]
    log.info(f"       Estatisticas: DeepSeek={translator.stats['deepseek']}, OpenAI={translator.stats['openai']}, DeepL={translator.stats['deepl']}, Fallbacks={translator.stats['fallbacks']}")

    # ═══ AUDITORIA ═══
    log.info("[21/21] Executando auditoria estrutural...")

    audit_results = {
        "estrutura": compare_html_structure(structural_reference, html_content),
        "js": audit_js_preservation(original_html, html_content),
        "seo": audit_seo(html_content, target_lang, filename),
        "footer": audit_footer(html_content),
    }

    # Corrigir automaticamente se necessário
    for repair_attempt in range(MAX_AUDIT_REPAIRS):
        all_passed = all(r.get("passed", True) for r in audit_results.values())
        if all_passed:
            break

        log.info(f"Correcao automatica - tentativa {repair_attempt + 1}/{MAX_AUDIT_REPAIRS}")
        html_content = auto_repair(html_content, target_lang, filename, audit_results)
        report["correcoes"] += 1

        # Re-auditar
        audit_results = {
            "estrutura": compare_html_structure(structural_reference, html_content),
            "js": audit_js_preservation(original_html, html_content),
            "seo": audit_seo(html_content, target_lang, filename),
            "footer": audit_footer(html_content),
        }

    all_passed = all(r.get("passed", True) for r in audit_results.values())
    report["auditoria"] = "APROVADA" if all_passed else "FALHA"

    if all_passed:
        log.info("       Auditoria: APROVADA - estrutura, SEO e footer OK.")
    else:
        log.warning("       Auditoria: FALHA - verificando issues...")
        for category, result in audit_results.items():
            if not result.get("passed", True):
                for issue in result.get("issues", []):
                    log.warning(f"       [{category}] {issue}")

    # ═══ PUBLICACAO ═══
    if all_passed and not DRY_RUN:
        log.info("       Iniciando publicacao...")

        # Backup temporario
        backup_dir = AUTOMACOES / "backups_traducao"
        backup_dir.mkdir(exist_ok=True)
        if dest_path.exists():
            backup_path = backup_dir / f"{target_lang}_{filename}.bak_{TIMESTAMP}"
            shutil.copy2(dest_path, backup_path)
            log.info(f"       Backup criado: {backup_path.name}")

        # Criar diretorio de destino
        dest_dir.mkdir(exist_ok=True)

        # Salvar versao temporaria para auditoria
        temp_path = AUTOMACOES / f"temp_{target_lang}_{filename}"
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        log.info(f"       Arquivo temporario salvo: {len(html_content):,} caracteres.")

        # Publicar
        shutil.copy2(temp_path, dest_path)
        temp_path.unlink()
        log.info(f"       Publicado: {dest_path}")

        report["publicacao"] = "REALIZADA"
        log.info(f"       Publicacao: REALIZADA")

        # Rodar build apos publicacao
        if BUILD_AFTER_TRANSLATION:
            run_build()

    elif DRY_RUN:
        # Salvar apenas em automacoes/ para inspecao
        dry_path = AUTOMACOES / f"dryrun_{target_lang}_{filename}"
        with open(dry_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        log.info(f"       DRY-RUN: Arquivo salvo em {dry_path}")
        log.info(f"                {len(html_content):,} caracteres.")
        report["publicacao"] = "DRY-RUN (nao publicado)"

    else:
        log.error("       Auditoria FALHOU. Arquivo NAO publicado.")
        log.error("       Corrija os problemas e execute novamente.")
        report["publicacao"] = "BLOQUEADA (auditoria falhou)"
        report["status"] = "FALHA"
        return report

    report["status"] = "CONCLUÍDO"
    report["termino"] = datetime.now().isoformat()
    return report


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         BUILD PÓS-TRADUÇÃO                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def run_build():
    """Executa tailwind + service worker apos traducao publicada."""
    build_cmd = (
        r'.\node_modules\.bin\tailwindcss -i ./src/input.css '
        r'-o ./public/output.css --minify ; node gerar-sw.js ;'
    )
    log.info("Executando build pós-tradução...")
    try:
        result = subprocess.run(
            ["powershell", "-Command", build_cmd],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0:
            log.info("Build concluido com sucesso.")
        else:
            log.warning(f"Build finalizado com codigo {result.returncode}.")
            if result.stderr and result.stderr.strip():
                log.warning(f"Build stderr: {result.stderr.strip()[-500:]}")
    except subprocess.TimeoutExpired:
        log.error("Build excedeu timeout de 120s.")
    except FileNotFoundError:
        log.error("PowerShell não encontrado. Build não executado.")
    except Exception as e:
        log.error(f"Erro ao executar build: {e}")


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         EXECUÇÃO PRINCIPAL                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def main():
    log.info("=" * 60)
    log.info("TRADUTOR CIRÚRGICO DE HTML PT-BR → 18 IDIOMAS")
    log.info(f"Data: {datetime.now().isoformat()}")
    log.info(f"Modo Teste: {MODO_TESTE}")
    log.info(f"Dry-Run: {DRY_RUN}")
    log.info(f"Arquivos: {ARQUIVOS_PARA_TRADUZIR}")
    log.info(f"Idiomas: {IDIOMAS_DESTINO}")
    log.info("=" * 60)

    # Validar configuração
    if not DEEPSEEK_KEY and not OPENAI_KEY:
        log.error("Nenhuma API key encontrada no .env")
        log.error("Configure DEEPSEEK_API_KEY e/ou OPENAI_API_KEY no .env")
        return

    if MODO_TESTE:
        if len(ARQUIVOS_PARA_TRADUZIR) > 1 or len(IDIOMAS_DESTINO) > 1:
            log.warning("MODO_TESTE ativo: limitando a 1 arquivo, 1 idioma")
            files_to_process = ARQUIVOS_PARA_TRADUZIR[:1]
            langs_to_process = IDIOMAS_DESTINO[:1]
        else:
            files_to_process = ARQUIVOS_PARA_TRADUZIR
            langs_to_process = IDIOMAS_DESTINO
    else:
        files_to_process = ARQUIVOS_PARA_TRADUZIR
        langs_to_process = IDIOMAS_DESTINO

    all_reports = []

    for filename in files_to_process:
        for lang in langs_to_process:
            if lang not in IDIOMA_MAP:
                log.error(f"Idioma desconhecido: {lang}")
                continue

            report = translate_file(filename, lang)
            all_reports.append(report)

            # Mostrar relatório
            log.info("---")
            log.info(f"RELATÓRIO: {filename} → {lang}")
            for key, value in report.items():
                log.info(f"  {key}: {value}")
            log.info("---")

            # Aguardar entre documentos
            if len(files_to_process) > 1 or len(langs_to_process) > 1:
                has_next = (filename != files_to_process[-1] or
                           lang != langs_to_process[-1])
                if has_next:
                    log.info(f"Aguardando {DOCUMENT_DELAY}s antes do próximo documento...")
                    time.sleep(DOCUMENT_DELAY)

    # Relatório final consolidado
    log.info("=" * 60)
    log.info("RELATÓRIO FINAL CONSOLIDADO")
    log.info("=" * 60)
    for report in all_reports:
        status_icon = "✓" if report["status"] == "CONCLUÍDO" else "✗"
        log.info(f"{status_icon} {report['arquivo']} → {report['idioma']}: "
                 f"{report['strings_traduzidas']} strings, "
                 f"DS:{report['deepseek']} OA:{report['openai']} DL:{report['deepl']} FB:{report['fallbacks']}, "
                 f"Auditoria:{report['auditoria']}, Publicação:{report['publicacao']}")

if __name__ == "__main__":
    main()
