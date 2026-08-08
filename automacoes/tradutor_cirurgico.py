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
    "es",
]

# Modo de teste: 1 arquivo, 1 idioma
MODO_TESTE = True

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

    # 1. Proteger <script>...</script> (nao-greedy)
    html_content = re.sub(
        r'<script\b[^>]*>.*?</script>',
        make_protector("SCRIPT"),
        html_content,
        flags=re.DOTALL,
    )

    # 2. Proteger <style>...</style> (nao-greedy)
    html_content = re.sub(
        r'<style\b[^>]*>.*?</style>',
        make_protector("STYLE"),
        html_content,
        flags=re.DOTALL,
    )

    # 3. Proteger <svg>...</svg>
    html_content = re.sub(
        r'<svg\b[^>]*>.*?</svg>',
        make_protector("SVG"),
        html_content,
        flags=re.DOTALL,
    )

    # 4. Proteger comentarios HTML
    html_content = re.sub(
        r'<!--.*?-->',
        make_protector("COMMENT"),
        html_content,
        flags=re.DOTALL,
    )

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

class BatchTranslator:
    """Gerencia tradução em lotes com intercalação DeepSeek/OpenAI."""

    def __init__(self, target_lang: str):
        self.target_lang = target_lang
        self.api_toggle = True  # True = DeepSeek, False = OpenAI
        self.stats = {"deepseek": 0, "openai": 0, "fallbacks": 0}

    def translate_batch(self, texts: list[str], context: str = "",
                        batch_num: int = 0, total_batches: int = 0) -> dict:
        """Traduz um lote de textos com retry e fallback.
        batch_num/total_batches opcionais para log de progresso em lotes grandes."""
        primary = "deepseek" if self.api_toggle else "openai"
        fallback_name = "openai" if self.api_toggle else "deepseek"
        self.api_toggle = not self.api_toggle

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

            log.info(f"    -> {primary} falhou ({ts_elapsed:.1f}s), tentando {fallback_name}...")
            time.sleep(2)
            ts_start = time.time()
            result = self._try_api(fallback_name, texts, context)
            ts_elapsed = time.time() - ts_start
            if result and self._validate_response(result, len(texts)):
                self.stats[fallback_name] += 1
                self.stats["fallbacks"] += 1
                if batch_num > 0:
                    log.info(f"    OK Lote {batch_num} via {fallback_name} (fallback) em {ts_elapsed:.1f}s")
                return result

            if attempt < MAX_RETRIES:
                log.info(f"    Aguardando {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)

        raise RuntimeError(f"Traducao falhou apos {MAX_RETRIES} tentativas.")

    def _try_api(self, api_name: str, texts: list[str], context: str) -> Optional[dict]:
        if api_name == "deepseek":
            return call_deepseek(texts, self.target_lang, context)
        else:
            return call_openai(texts, self.target_lang, context)

    def _validate_response(self, response: dict, expected_count: int) -> bool:
        """Valida resposta da API."""
        if not response or "translations" not in response:
            return False
        translations = response["translations"]
        if len(translations) != expected_count:
            log.warning(f"Contagem inválida: esperado {expected_count}, obtido {len(translations)}")
            return False
        for t in translations:
            if "id" not in t or "translation" not in t:
                return False
            if not t["translation"] or not t["translation"].strip():
                return False
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
    """Processa Schema.org JSON-LD."""
    schema_match = re.search(
        r'<script\s+type="application/ld\+json">(.*?)</script>',
        html_content, re.DOTALL
    )
    if not schema_match:
        return html_content

    try:
        schema = json.loads(schema_match.group(1))
    except json.JSONDecodeError:
        return html_content

    # Coletar textos traduzíveis do schema
    texts_to_translate = []
    text_positions = []

    def collect_texts(obj, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in ("name", "description", "headline", "alternativeHeadline",
                         "articleSection", "about", "text") and isinstance(v, str) and v.strip():
                    texts_to_translate.append(v)
                    text_positions.append((path + "." + k if path else k, "text"))
                elif k == "url" and isinstance(v, str) and "calculadorasdeenfermagem.com.br" in v:
                    texts_to_translate.append(v)
                    text_positions.append((path + "." + k if path else k, "url"))
                else:
                    collect_texts(v, path + "." + k if path else k)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                collect_texts(item, f"{path}[{i}]")

    if isinstance(schema, dict) and "@graph" in schema:
        collect_texts(schema["@graph"], "@graph")
    else:
        collect_texts(schema, "")

    if not texts_to_translate:
        return html_content

    # Filtrar apenas textos (não URLs) para tradução
    text_only = []
    for t, (pos, kind) in zip(texts_to_translate, text_positions):
        if kind == "text":
            text_only.append(t)

    if not text_only:
        # Só tem URLs, processar sem API
        pass
    else:
        result = translator.translate_batch(text_only, "Schema.org structured data")
        translations = result["translations"]

        # Aplicar traduções de volta
        ti = 0
        for i, (t, (pos, kind)) in enumerate(zip(texts_to_translate, text_positions)):
            if kind == "text" and ti < len(translations):
                texts_to_translate[i] = translations[ti]["translation"]
                ti += 1

    # Reconstruir schema com valores traduzidos e URLs adaptadas
    ti = 0
    url_ti = 0

    def apply_translations(obj, path=""):
        nonlocal ti
        if isinstance(obj, dict):
            for k in list(obj.keys()):
                current_path = path + "." + k if path else k
                if k in ("name", "description", "headline", "alternativeHeadline",
                         "articleSection", "about", "text") and isinstance(obj[k], str):
                    if ti < len(texts_to_translate):
                        obj[k] = texts_to_translate[ti]
                        ti += 1
                elif k == "url" and isinstance(obj[k], str):
                    obj[k] = adapt_url(obj[k], target_lang)
                else:
                    apply_translations(obj[k], current_path)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                apply_translations(item, f"{path}[{i}]")

    apply_translations(schema)

    new_schema = json.dumps(schema, ensure_ascii=False, indent=2)
    html_content = html_content.replace(schema_match.group(1), new_schema)
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
    """Reconstrói bloco hreflang com idioma de destino primeiro."""
    hreflang_lines = []

    # Linha do idioma de destino primeiro
    info = IDIOMA_MAP[target_lang]
    dest_url = f"{BASE_URL}/{target_lang}/{filename}"
    hreflang_lines.append(
        f'<link href="{dest_url}" hreflang="{target_lang}" rel="alternate"/>'
    )

    # Português (original)
    pt_url = f"{BASE_URL}/{filename}"
    hreflang_lines.append(
        f'<link href="{pt_url}" hreflang="pt-br" rel="alternate"/>'
    )

    # Demais idiomas em ordem alfabética
    for code in sorted(IDIOMA_MAP.keys()):
        if code == target_lang or code == "pt":
            continue
        lang_url = f"{BASE_URL}/{code}/{filename}"
        hreflang_lines.append(
            f'<link href="{lang_url}" hreflang="{code}" rel="alternate"/>'
        )

    # x-default (sempre pt-br)
    hreflang_lines.append(
        f'<link href="{pt_url}" hreflang="x-default" rel="alternate"/>'
    )

    new_block = "\n".join(hreflang_lines)

    # Encontrar e substituir bloco hreflang existente
    # Padrão: sequência de links hreflang
    hreflang_pattern = r'(?:<link[^>]*hreflang="[^"]*"[^>]*>\s*)+'
    match = re.search(hreflang_pattern, html_content)
    if match:
        html_content = html_content.replace(match.group(0), new_block + "\n")

    return html_content

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    LINKS INTERNOS                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def process_internal_links(html_content: str, target_lang: str) -> str:
    """Adapta links internos para o idioma de destino."""
    # Identificar links internos: href="/algo.html" ou href="/pasta/algo.html"
    # que NÃO são de idioma (não começam com /xx/ onde xx é código de idioma)

    lang_codes = set(IDIOMA_MAP.keys())

    def should_adapt(href: str) -> bool:
        if not href.startswith("/"):
            return False
        if href.startswith("//"):
            return False
        if href.startswith("/#"):
            return False
        if any(href.startswith(f"/{code}/") for code in lang_codes):
            return False
        if not href.endswith(".html"):
            # Verificar se é uma página interna conhecida
            pass
        return True

    def adapt_link(match):
        full = match.group(0)
        href = match.group(1)
        if should_adapt(href):
            new_href = f"/{target_lang}{href}"
            return full.replace(f'href="{href}"', f'href="{new_href}"')
        return full

    # Links em <a href="...">
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
    """Substitui fontes para idiomas especiais (ar, hi, zh, ja, ko)."""
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

    # Substituir preloads de fontes
    # Remove preloads existentes de /fonts/inter/ e /fonts/nunito/
    html_content = re.sub(
        r'<link[^>]*href="[^"]*/fonts/(?:inter|nunito)/[^"]*"[^>]*>\s*',
        '',
        html_content,
    )

    # Insere novos preloads após o último <link...> existente antes de <script>
    script_pos = html_content.find('<script src="/global-scripts.js"')
    if script_pos > 0:
        html_content = (
            html_content[:script_pos] +
            font_config["preloads"] + "\n" +
            html_content[script_pos:]
        )

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

def audit_structure(original: str, translated: str) -> dict:
    """Compara estrutura do HTML original com traduzido."""
    issues = []

    # Contar elementos por tipo de tag
    def count_tags(html_content):
        tags = re.findall(r'</?(\w+)[^>]*>', html_content)
        from collections import Counter
        return Counter(tags)

    orig_tags = count_tags(original)
    trans_tags = count_tags(translated)

    for tag in orig_tags:
        if orig_tags[tag] != trans_tags.get(tag, 0):
            issues.append(f"Tag <{tag}>: original={orig_tags[tag]}, traduzido={trans_tags.get(tag, 0)}")

    # Verificar placeholders não restaurados
    if PLACEHOLDER_PREFIX in translated:
        remaining = re.findall(rf'{re.escape(PLACEHOLDER_PREFIX)}\w+_\d+___', translated)
        if remaining:
            issues.append(f"Placeholders não restaurados: {len(remaining)}")

    # Verificar scripts preservados
    orig_scripts = re.findall(r'<script[^>]*>.*?</script>', original, re.DOTALL)
    trans_scripts = re.findall(r'<script[^>]*>.*?</script>', translated, re.DOTALL)
    if len(orig_scripts) != len(trans_scripts):
        issues.append(f"Scripts: original={len(orig_scripts)}, traduzido={len(trans_scripts)}")

    return {
        "passed": len(issues) == 0,
        "issues": issues,
        "tag_counts_original": dict(orig_tags),
        "tag_counts_translated": dict(trans_tags),
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

    # ═══ FASE 2: CORPO HTML ═══
    log.info("═════ FASE 2/2: Traduzindo corpo HTML ═════")

    log.info("[15/20] Protegendo blocos tecnicos (scripts, styles, SVGs, comentarios)...")
    html_content, protected, reverse_map = protect_html_blocks(html_content)
    log.info(f"       {len(protected)} blocos protegidos.")

    log.info("[16/20] Extraindo textos de atributos (title, alt, aria-label, placeholder)...")
    html_content, attr_map = extract_translatable_attributes(html_content)
    log.info(f"       {len(attr_map)} atributos extraidos.")

    log.info("[17/20] Extraindo textos do corpo HTML...")
    html_content, text_map = extract_text_nodes(html_content)

    total_texts = len(text_map) + len(attr_map)
    log.info(f"       Total de textos a traduzir: {total_texts} (body: {len(text_map)}, attrs: {len(attr_map)})")
    report["strings_traduzidas"] = total_texts

    log.info("[18/20] Enviando textos para traducao via API (DeepSeek <-> OpenAI)...")
    html_content = translate_body_texts(
        html_content, target_lang, translator, text_map, attr_map
    )

    log.info("[19/20] Restaurando blocos protegidos...")
    html_content = restore_protected_blocks(html_content, reverse_map)
    report["deepseek"] = translator.stats["deepseek"]
    report["openai"] = translator.stats["openai"]
    report["fallbacks"] = translator.stats["fallbacks"]
    log.info(f"       Estatisticas: DeepSeek={translator.stats['deepseek']}, OpenAI={translator.stats['openai']}, Fallbacks={translator.stats['fallbacks']}")

    # ═══ AUDITORIA ═══
    log.info("[20/20] Executando auditoria estrutural...")

    audit_results = {
        "estrutura": audit_structure(original_html, html_content),
        "seo": audit_seo(html_content, target_lang, filename),
        "footer": audit_footer(html_content),
    }

    # Corrigir automaticamente se necessário
    for repair_attempt in range(MAX_AUDIT_REPAIRS):
        all_passed = all(r.get("passed", True) for r in audit_results.values())
        if all_passed:
            break

        log.info(f"Correção automática - tentativa {repair_attempt + 1}/{MAX_AUDIT_REPAIRS}")
        html_content = auto_repair(html_content, target_lang, filename, audit_results)
        report["correcoes"] += 1

        # Re-auditar
        audit_results = {
            "estrutura": audit_structure(original_html, html_content),
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
            log.info("Build concluído com sucesso.")
            if result.stdout.strip():
                log.info(f"Build output: {result.stdout.strip()[-300:]}")
        else:
            log.warning(f"Build finalizado com código {result.returncode}.")
            if result.stderr.strip():
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
                 f"DS:{report['deepseek']} OA:{report['openai']} FB:{report['fallbacks']}, "
                 f"Auditoria:{report['auditoria']}, Publicação:{report['publicacao']}")

if __name__ == "__main__":
    main()
