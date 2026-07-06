"""
Módulo de Tradução HTML via IA (DeepSeek + OpenAI)
==================================================
Substitui o DeepL quando a cota está esgotada.

Estratégia:
1. Extrai CIRURGICAMENTE apenas textos visíveis do HTML (nós de texto)
2. Ignora <script>, <style>, <code>, <pre>, <svg>, <math>
3. Divide em blocos de ~8000 caracteres (≈2000 tokens)
4. Envia cada bloco como JSON para DeepSeek (fallback: OpenAI)
5. Aguarda 120s entre blocos para respeitar rate limits
6. Salva progresso a cada bloco (retomada segura)
7. Reconstrói o HTML com os textos traduzidos
"""

import re
import json
import time
import os
import requests

# ============================================================
# CONFIGURAÇÃO
# ============================================================
MAX_CHARS_POR_BLOCO = 8000   # ~2000 tokens (1 token ≈ 4 chars em PT)
PAUSA_ENTRE_BLOCOS = 120     # segundos entre blocos
ARQUIVO_PROGRESSO = "progresso_traducao_ia.json"

NOME_IDIOMAS = {
    "en": "Inglês (English)",
    "es": "Espanhol (Español)",
    "fr": "Francês (Français)",
    "it": "Italiano (Italiano)",
    "de": "Alemão (Deutsch)",
    "hi": "Hindi (हिन्दी)",
    "zh": "Chinês (中文)",
    "ja": "Japonês (日本語)",
    "ru": "Russo (Русский)",
    "ko": "Coreano (한국어)",
    "tr": "Turco (Türkçe)",
    "nl": "Holandês (Nederlands)",
    "pl": "Polonês (Polski)",
    "sv": "Sueco (Svenska)",
    "id": "Indonésio (Bahasa Indonesia)",
    "vi": "Vietnamita (Tiếng Việt)",
    "uk": "Ucraniano (Українська)",
    "ar": "Árabe (العربية)",
}


# ============================================================
# EXTRAÇÃO DE TEXTOS DO HTML
# ============================================================

def extrair_textos_traduziveis(html):
    """
    Extrai CIRURGICAMENTE todos os textos visíveis do HTML.
    Retorna lista de {'text': str, 'start': int, 'end': int}

    Ignora:
    - Conteúdo dentro de <script>, <style>, <code>, <pre>, <svg>, <math>
    - Comentários HTML <!-- ... -->
    - Textos que são apenas números/símbolos/código
    - Atributos HTML (já estão dentro das tags)
    """
    textos = []

    # 1. Remove comentários HTML temporariamente (substitui por espaços para preservar índices)
    def replace_comment(match):
        return " " * len(match.group(0))
    html_limpo = re.sub(r'<!--.*?-->', replace_comment, html, flags=re.DOTALL)

    # 2. Encontra regiões a serem IGNORADAS (script, style, code, pre, svg, math)
    tags_ignorar = r'<(script|style|code|pre|svg|math)\b[^>]*>.*?</\1>'
    regioes_ignoradas = [
        (m.start(), m.end())
        for m in re.finditer(tags_ignorar, html_limpo, re.IGNORECASE | re.DOTALL)
    ]

    def is_ignorado(pos):
        """Verifica se uma posição está dentro de uma região ignorada."""
        for inicio, fim in regioes_ignoradas:
            if inicio <= pos < fim:
                return True
        return False

    # 3. Encontra textos entre > e < (nós de texto HTML)
    padrao_texto = re.compile(r'>([^<]+)<')

    for match in padrao_texto.finditer(html_limpo):
        texto = match.group(1)
        inicio_real = match.start(1)
        fim_real = match.end(1)

        # Pula se está em região ignorada
        if is_ignorado(inicio_real):
            continue

        # Limpa e verifica se é texto traduzível
        texto_limpo = texto.strip()
        if not texto_limpo:
            continue

        # Pula se for apenas números, símbolos, ou caracteres especiais
        if re.match(r'^[\d\s.,;:!?\-–—+/\\*=<>()[\]{}|&@#$%^~`´\t\n\r]+$', texto_limpo):
            continue

        # Pula strings muito curtas sem letras
        if len(texto_limpo) < 2:
            continue
        if not re.search(r'[a-zA-ZÀ-ÿ]', texto_limpo):
            continue

        textos.append({
            'text': texto,  # texto original COM espaçamento original
            'start': inicio_real,
            'end': fim_real,
        })

    return textos


# ============================================================
# DIVISÃO EM BLOCOS (CHUNKING)
# ============================================================

def dividir_em_blocos(textos, max_chars=MAX_CHARS_POR_BLOCO):
    """
    Divide a lista de textos em blocos que respeitam o limite de tokens.
    Cada bloco terá no máximo max_chars caracteres somados.
    """
    blocos = []
    bloco_atual = []
    chars_atual = 0

    for texto_info in textos:
        texto_len = len(texto_info['text'])

        # Se um único texto excede o limite, ele vai em bloco próprio
        if texto_len > max_chars and not bloco_atual:
            blocos.append([texto_info])
            continue

        # Se adicionar este texto excederia o limite, fecha o bloco atual
        if chars_atual + texto_len > max_chars and bloco_atual:
            blocos.append(bloco_atual)
            bloco_atual = []
            chars_atual = 0

        bloco_atual.append(texto_info)
        chars_atual += texto_len

    # Não esquecer o último bloco
    if bloco_atual:
        blocos.append(bloco_atual)

    return blocos


# ============================================================
# SISTEMA DE PROMPT (REGRAS DE TRADUÇÃO)
# ============================================================

def _criar_sistema_prompt(idioma_alvo):
    """Cria o prompt de sistema com regras rígidas de tradução."""
    nome_idioma = NOME_IDIOMAS.get(idioma_alvo, idioma_alvo)

    return f"""Você é um tradutor cirúrgico especializado em ENFERMAGEM e SAÚDE.
Sua ÚNICA tarefa: traduzir textos do Português (Brasil) para {nome_idioma}.

╔══════════════════════════════════════════════════════════════╗
║              REGRAS CRÍTICAS E INEGOCIÁVEIS                  ║
╚══════════════════════════════════════════════════════════════╝

1. NÃO MODIFIQUE as chaves do JSON. Mantenha-as EXATAMENTE iguais.
2. Retorne APENAS um JSON válido. NUNCA use marcações markdown (```).
3. NÃO adicione ou remova espaços no início/fim de cada texto.
4. Preserve EXATAMENTE a pontuação original (.:!?;-) e quebras de linha (\\n).
5. TRADUZA APENAS o texto humano legível. Se houver código, classes CSS, 
   IDs ou atributos HTML no meio do texto, NÃO OS TRADUZA.
6. Números, fórmulas, unidades de medida e valores NÃO devem ser alterados.
7. Para terminologia técnica de enfermagem (ex: "Escala de Braden", 
   "Sondagem vesical"), use o termo padrão oficial no idioma alvo.
8. Mantenha as MESMAS aspas do original (simples ' ou duplas ").
9. Se um texto for uma opção de select, label de formulário, placeholder 
   ou resultado de cálculo, traduza-o integralmente.
10. NÃO invente conteúdo novo. Traduza EXATAMENTE o que recebeu."""


# ============================================================
# TRADUÇÃO VIA DEEPSEEK
# ============================================================

def _traduzir_json_deepseek(dict_textos, idioma_alvo, chave_deepseek):
    """
    Envia um dicionário {id: texto} para o DeepSeek.
    Retorna {id: texto_traduzido}.
    """
    sistema = _criar_sistema_prompt(idioma_alvo)

    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {chave_deepseek}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": sistema},
            {"role": "user", "content": json.dumps(dict_textos, ensure_ascii=False)},
        ],
        "temperature": 0.0,
        "max_tokens": 4096,
        "response_format": {"type": "json_object"},
    }

    response = requests.post(url, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    resultado = response.json()["choices"][0]["message"]["content"].strip()

    # Limpeza de markdown (caso a IA insista em usar)
    if resultado.startswith("```"):
        resultado = re.sub(r'^```(?:json)?\s*\n?', '', resultado, flags=re.IGNORECASE)
        resultado = re.sub(r'\n?```\s*$', '', resultado)

    return json.loads(resultado)


# ============================================================
# TRADUÇÃO VIA OPENAI (FALLBACK)
# ============================================================

def _traduzir_json_openai(dict_textos, idioma_alvo, chave_openai):
    """
    Fallback: usa OpenAI GPT-4o-mini quando DeepSeek falha.
    """
    sistema = _criar_sistema_prompt(idioma_alvo)

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {chave_openai}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": sistema},
            {"role": "user", "content": json.dumps(dict_textos, ensure_ascii=False)},
        ],
        "temperature": 0.0,
        "max_tokens": 4096,
        "response_format": {"type": "json_object"},
    }

    response = requests.post(url, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    resultado = response.json()["choices"][0]["message"]["content"].strip()

    if resultado.startswith("```"):
        resultado = re.sub(r'^```(?:json)?\s*\n?', '', resultado, flags=re.IGNORECASE)
        resultado = re.sub(r'\n?```\s*$', '', resultado)

    return json.loads(resultado)


# ============================================================
# RECONSTRUÇÃO DO HTML
# ============================================================

def reconstruir_html(html_original, textos_originais, todas_traducoes):
    """
    Reconstrói o HTML substituindo textos originais pelas traduções.
    Processa de trás para frente para preservar os índices de posição.
    """
    html_modificado = html_original

    # Ordena por posição decrescente (de trás para frente)
    textos_ordenados = sorted(
        enumerate(textos_originais), key=lambda x: x[1]['start'], reverse=True
    )

    for idx_global, texto_info in textos_ordenados:
        chave = f"t{idx_global}"
        if chave not in todas_traducoes:
            continue

        texto_traduzido = todas_traducoes[chave]
        original = texto_info['text']

        # Preserva espaçamento inicial/final do original
        if original.startswith((' ', '\n', '\t')) and not texto_traduzido.startswith((' ', '\n', '\t')):
            # Mantém o primeiro caractere de espaçamento
            texto_traduzido = original[0] + texto_traduzido
        if original.endswith((' ', '\n', '\t')) and not texto_traduzido.endswith((' ', '\n', '\t')):
            texto_traduzido = texto_traduzido + original[-1]

        # Substituição cirúrgica
        html_modificado = (
            html_modificado[:texto_info['start']]
            + texto_traduzido
            + html_modificado[texto_info['end']:]
        )

    return html_modificado


# ============================================================
# PIPELINE COMPLETO
# ============================================================

def traduzir_html_completo(html, idioma_alvo, chave_deepseek, chave_openai=None):
    """
    Pipeline completo de tradução HTML via IA.

    Fluxo:
    1. Extrai textos traduzíveis do HTML
    2. Divide em blocos (respeitando limite de tokens)
    3. Traduz cada bloco via DeepSeek (fallback: OpenAI)
    4. Aguarda 120s entre blocos
    5. Salva progresso incremental (retomada segura)
    6. Reconstrói HTML com os textos traduzidos

    Args:
        html: HTML original (já com placeholders de scripts/styles)
        idioma_alvo: código ISO do idioma (ex: 'en', 'es', 'fr')
        chave_deepseek: API key do DeepSeek
        chave_openai: API key do OpenAI (opcional, fallback)

    Returns:
        HTML traduzido ou None em caso de erro total
    """
    print("      \033[96m↳ [IA] Extraindo textos do HTML...\033[0m")
    textos = extrair_textos_traduziveis(html)
    print(f"      \033[96m↳ [IA] {len(textos)} textos extraídos para tradução.\033[0m")

    if not textos:
        print("      \033[93m↳ [IA] Nenhum texto traduzível encontrado. Retornando original.\033[0m")
        return html

    # Divide em blocos
    blocos = dividir_em_blocos(textos)
    total_chars = sum(len(t['text']) for t in textos)
    print(f"      \033[96m↳ [IA] {total_chars} caracteres divididos em {len(blocos)} blocos (~{MAX_CHARS_POR_BLOCO} chars cada).\033[0m")

    # Dicionário global de traduções
    todas_traducoes = {}

    # Verifica progresso salvo (retomada)
    bloco_inicial = 0
    if os.path.exists(ARQUIVO_PROGRESSO):
        try:
            with open(ARQUIVO_PROGRESSO, 'r', encoding='utf-8') as f:
                progresso = json.load(f)
            # Só retoma se for do mesmo idioma
            if progresso.get('idioma') == idioma_alvo:
                todas_traducoes = progresso.get('traducoes', {})
                bloco_inicial = progresso.get('bloco_atual', 0)
                if bloco_inicial > 0:
                    print(f"      \033[93m↳ [IA] ↻ Retomando do bloco {bloco_inicial + 1}/{len(blocos)}...\033[0m")
        except Exception:
            pass

    # Processa cada bloco
    for idx_bloco in range(bloco_inicial, len(blocos)):
        bloco = blocos[idx_bloco]

        # Prepara dicionário para este bloco (pula textos já traduzidos)
        dict_bloco = {}
        for texto_info in bloco:
            idx_global = textos.index(texto_info)
            chave = f"t{idx_global}"
            if chave not in todas_traducoes:
                dict_bloco[chave] = texto_info['text']

        if not dict_bloco:
            print(f"      \033[96m↳ [IA] Bloco {idx_bloco + 1}/{len(blocos)} já traduzido. Pulando...\033[0m")
            continue

        chars_bloco = sum(len(v) for v in dict_bloco.values())
        print(f"      \033[96m↳ [IA] Bloco {idx_bloco + 1}/{len(blocos)}: {len(dict_bloco)} textos, ~{chars_bloco} chars...\033[0m")

        # Tenta DeepSeek primeiro
        traducoes_bloco = None
        provedor = ""

        try:
            traducoes_bloco = _traduzir_json_deepseek(dict_bloco, idioma_alvo, chave_deepseek)
            provedor = "DeepSeek"
        except Exception as e:
            print(f"      \033[93m↳ [IA] DeepSeek falhou: {type(e).__name__}: {str(e)[:150]}\033[0m")

            # Fallback OpenAI
            if chave_openai:
                try:
                    print(f"      \033[96m↳ [IA] Tentando via OpenAI (gpt-4o-mini)...\033[0m")
                    traducoes_bloco = _traduzir_json_openai(dict_bloco, idioma_alvo, chave_openai)
                    provedor = "OpenAI"
                except Exception as e2:
                    print(f"      \033[91m↳ [IA] OpenAI também falhou: {type(e2).__name__}: {str(e2)[:150]}\033[0m")

        # Se ambos falharam, mantém originais para este bloco
        if traducoes_bloco is None:
            print(f"      \033[93m↳ [IA] Mantendo textos originais para este bloco.\033[0m")
            traducoes_bloco = {chave: texto for chave, texto in dict_bloco.items()}
            provedor = "ORIGINAL (não traduzido)"
        else:
            print(f"      \033[92m↳ [IA] Bloco {idx_bloco + 1} ✓ via {provedor}\033[0m")

        # Acumula e salva progresso
        todas_traducoes.update(traducoes_bloco)

        with open(ARQUIVO_PROGRESSO, 'w', encoding='utf-8') as f:
            json.dump({
                'idioma': idioma_alvo,
                'bloco_atual': idx_bloco + 1,
                'total_blocos': len(blocos),
                'traducoes': todas_traducoes,
            }, f, ensure_ascii=False, indent=2)

        # Pausa entre blocos (exceto após o último)
        if idx_bloco < len(blocos) - 1:
            print(f"      \033[93m↳ [IA] ⏳ Aguardando {PAUSA_ENTRE_BLOCOS}s (rate limit)...\033[0m")
            time.sleep(PAUSA_ENTRE_BLOCOS)

    # Reconstrói HTML
    print(f"      \033[96m↳ [IA] Reconstruindo HTML com {len(todas_traducoes)} traduções...\033[0m")
    html_traduzido = reconstruir_html(html, textos, todas_traducoes)

    # Limpa arquivo de progresso
    if os.path.exists(ARQUIVO_PROGRESSO):
        os.remove(ARQUIVO_PROGRESSO)

    print(f"      \033[92m↳ [IA] ✅ Tradução HTML concluída!\033[0m")
    return html_traduzido
