"""
TRANSLATE.PY — Etapas 4, 5 e 6 do Pipeline de Tradução
========================================================
4. Gera arquivo temporário com texto puro + IDs
5. Envia em lotes para APIs (DeepSeek ↔ OpenAI, 10 blocos + failover)
6. Mantém cache permanente de traduções (translation_cache/)
"""

import os
import re
import json
import time
import requests
from dotenv import load_dotenv

# ============================================================
# CONFIGURAÇÃO
# ============================================================

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
CHAVE_OPENAI = os.getenv("OPENAI_API_KEY")

PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
PASTA_CACHE = os.path.join(PASTA_TRADUTOR, "cache")
PASTA_TRANSLATION_CACHE = os.path.join(PASTA_TRADUTOR, "translation_cache")
PASTA_TEMP = os.path.join(PASTA_TRADUTOR, "temp")

ARQUIVO_CACHE_PERMANENTE = os.path.join(PASTA_TRANSLATION_CACHE, "idiomas.json")
ARQUIVO_TEMP = os.path.join(PASTA_TEMP, "translation.txt")
ARQUIVO_TRADUZIDO = os.path.join(PASTA_TEMP, "translated.txt")

# Lote: até 100 textos ou 5000 caracteres por bloco
MAX_TEXTOS_POR_LOTE = 100
MAX_CHARS_POR_LOTE = 5000

# 10 tentativas de retry com 10s entre cada
MAX_TENTATIVAS = 10
PAUSA_RETRY = 10

# Termos que NUNCA devem ser traduzidos (preservados no cache)
TERMOS_PRESERVADOS = {
    "APACHE II", "NANDA", "NIC", "NOC", "CIPE", "NIHSS", "AVPU",
    "NEWS", "NEWS 2", "SOFA", "MEWS", "Glasgow", "Braden", "Fugulin",
    "Barthel", "Apgar", "ASA", "CURB-65", "Waterlow", "COP-SOQ",
}

NOME_IDIOMAS = {
    "en": "Inglês", "es": "Espanhol", "fr": "Francês", "it": "Italiano",
    "de": "Alemão", "hi": "Hindi", "zh": "Chinês", "ja": "Japonês",
    "ru": "Russo", "ko": "Coreano", "tr": "Turco", "nl": "Holandês",
    "pl": "Polonês", "sv": "Sueco", "id": "Indonésio", "vi": "Vietnamita",
    "uk": "Ucraniano", "ar": "Árabe",
}


# ============================================================
# CACHE PERMANENTE
# ============================================================

def carregar_cache_permanente():
    """Carrega o cache de traduções já feitas."""
    if os.path.exists(ARQUIVO_CACHE_PERMANENTE):
        with open(ARQUIVO_CACHE_PERMANENTE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def salvar_cache_permanente(cache):
    """Salva o cache de traduções."""
    os.makedirs(PASTA_TRANSLATION_CACHE, exist_ok=True)
    with open(ARQUIVO_CACHE_PERMANENTE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def verificar_cache(texto, idioma, cache):
    """Verifica se um texto já está no cache para o idioma alvo."""
    if texto in TERMOS_PRESERVADOS:
        return texto  # nunca traduz termos médicos
    
    if texto in cache and idioma in cache[texto]:
        return cache[texto][idioma]
    return None


def atualizar_cache(texto, idioma, traducao, cache):
    """Atualiza o cache com uma nova tradução."""
    if texto not in cache:
        cache[texto] = {}
    cache[texto][idioma] = traducao


# ============================================================
# GERAÇÃO DE ARQUIVO TEMPORÁRIO (Etapa 4)
# ============================================================

def gerar_arquivo_temporario(textos_pendentes):
    """
    Gera temp/translation.txt com formato:
    [0001]
    texto original
    
    [0002]
    texto original
    """
    os.makedirs(PASTA_TEMP, exist_ok=True)
    
    with open(ARQUIVO_TEMP, 'w', encoding='utf-8') as f:
        for item in textos_pendentes:
            f.write(f"[{item['id_original']:04d}]\n")
            f.write(f"{item['texto']}\n\n")
    
    return ARQUIVO_TEMP


def parse_resposta_traduzida(conteudo):
    """
    Faz parse do formato:
    [0001]
    texto traduzido
    
    [0002]
    texto traduzido
    """
    resultado = {}
    padrao = re.compile(r'\[(\d{4})\]\n(.*?)(?=\n\[\d{4}\]|\n?\Z)', re.DOTALL)
    
    for match in padrao.finditer(conteudo):
        id_str = match.group(1)
        texto = match.group(2).strip()
        resultado[int(id_str)] = texto
    
    return resultado


# ============================================================
# DIVISÃO EM LOTES
# ============================================================

def dividir_em_lotes(textos_pendentes):
    """Divide textos em lotes de até 100 itens ou 5000 caracteres."""
    lotes = []
    lote_atual = []
    chars_atual = 0
    
    for item in textos_pendentes:
        tamanho = len(item['texto'])
        
        if (len(lote_atual) >= MAX_TEXTOS_POR_LOTE or
            chars_atual + tamanho > MAX_CHARS_POR_LOTE):
            if lote_atual:
                lotes.append(lote_atual)
            lote_atual = []
            chars_atual = 0
        
        lote_atual.append(item)
        chars_atual += tamanho
    
    if lote_atual:
        lotes.append(lote_atual)
    
    return lotes


# ============================================================
# CHAMADA ÀS APIs (Etapa 5)
# ============================================================

def _chamar_api(dict_textos, idioma_alvo, modelo, nome_idioma):
    """
    Chama DeepSeek ou OpenAI para traduzir um dicionário {id: texto}.
    Retorna dicionário {id: texto_traduzido} ou None se falhar.
    """
    sistema = f"""Você é um tradutor profissional de saúde/enfermagem com expertise em localização clínica.
Traduza os textos do Português (Brasil) para {nome_idioma} ({idioma_alvo}).

REGRAS DE QUALIDADE:
- NUNCA faça tradução literal. Adapte expressões culturais ao país de destino.
- Use jargão médico local, siglas e protocolos clínicos padronizados no país alvo.
- Adapte pesos (kg/lb), medidas (cm/in) e nomenclatura de exames ao padrão local.
- Termos como "Enfermeiro(a)" devem usar a titulação profissional do país alvo (ex: Registered Nurse nos EUA, Enfermera na Espanha).
- "Prontuário" = Medical Record (EN), Historia Clínica (ES), Dossier Médical (FR), etc.

REGRAS INEGOCIÁVEIS:
1. PRESERVE SIGLAS MÉDICAS: {', '.join(sorted(TERMOS_PRESERVADOS))}
2. Respeite terminologias técnicas de enfermagem e medicina.
3. Retorne EXCLUSIVAMENTE no formato EXATO abaixo, sem explicações:

[0001]
texto traduzido

[0002]
texto traduzido"""

    # Constrói o prompt com os textos
    prompt_usuario = ""
    for chave, texto in dict_textos.items():
        # chave é "0001", "0002" etc.
        prompt_usuario += f"[{chave}]\n{texto}\n\n"

    if modelo == "DeepSeek":
        if not CHAVE_DEEPSEEK:
            return None
        url = "https://api.deepseek.com/chat/completions"
        headers = {"Authorization": f"Bearer {CHAVE_DEEPSEEK}", "Content-Type": "application/json"}
        payload = {
            "model": "deepseek-v4-pro",
            "messages": [
                {"role": "system", "content": sistema},
                {"role": "user", "content": prompt_usuario.strip()}
            ],
            "temperature": 0.1,
            "max_tokens": 8000,
        }
        timeout = 90
    else:
        if not CHAVE_OPENAI:
            return None
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {CHAVE_OPENAI}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": sistema},
                {"role": "user", "content": prompt_usuario.strip()}
            ],
            "temperature": 0.1,
            "max_tokens": 8000,
        }
        timeout = 120

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        return parse_resposta_traduzida(resultado)
    except Exception as e:
        return None


def traduzir_lotes(lotes, idioma_alvo, nome_idioma):
    """
    Traduz todos os lotes usando 10 blocos intercalados DeepSeek ↔ OpenAI,
    com retry de até 10 tentativas e failover entre APIs.
    """
    todas_traducoes = {}
    total_lotes = len(lotes)
    
    # Agrupa lotes em 10 blocos maiores
    NUM_BLOCOS = 10
    tamanho_bloco = max(1, (total_lotes + NUM_BLOCOS - 1) // NUM_BLOCOS)
    blocos_lotes = [lotes[i:i + tamanho_bloco] for i in range(0, total_lotes, tamanho_bloco)]
    
    while len(blocos_lotes) < NUM_BLOCOS:
        blocos_lotes.append([])
    
    for idx_bloco, bloco_lotes in enumerate(blocos_lotes):
        if not bloco_lotes:
            continue
        
        # Junta todos os itens deste bloco em um dict
        dict_bloco = {}
        for lote in bloco_lotes:
            for item in lote:
                dict_bloco[f"{item['id_original']:04d}"] = item['texto']
        
        if not dict_bloco:
            continue
        
        print(f"  🧩 Bloco {idx_bloco+1}/{NUM_BLOCOS} ({len(dict_bloco)} textos)...")
        
        traduzido = None
        
        for tentativa in range(MAX_TENTATIVAS):
            alternar = (idx_bloco + tentativa) % 2 == 0
            primario = "DeepSeek" if alternar else "OpenAI"
            fallback = "OpenAI" if alternar else "DeepSeek"
            
            # Tenta primário
            traduzido = _chamar_api(dict_bloco, idioma_alvo, primario, nome_idioma)
            if traduzido:
                print(f"    ✅ {primario} (tentativa {tentativa+1})")
                break
            
            # Tenta fallback
            print(f"    ⚠️ {primario} falhou → {fallback}...")
            traduzido = _chamar_api(dict_bloco, idioma_alvo, fallback, nome_idioma)
            if traduzido:
                print(f"    ✅ {fallback} (tentativa {tentativa+1})")
                break
            
            if tentativa < MAX_TENTATIVAS - 1:
                print(f"    ❌ Ambas falharam ({tentativa+1}/{MAX_TENTATIVAS}). ⏳ {PAUSA_RETRY}s...")
                time.sleep(PAUSA_RETRY)
        else:
            print(f"    ❌❌ Todas as {MAX_TENTATIVAS} falharam. Mantendo originais.")
            traduzido = {}
        
        todas_traducoes.update(traduzido)
        
        if idx_bloco < len(blocos_lotes) - 1:
            time.sleep(PAUSA_RETRY)
    
    return todas_traducoes


# ============================================================
# PIPELINE PRINCIPAL DE TRADUÇÃO
# ============================================================

def traduzir_arquivo(nome_arquivo, idioma_alvo):
    """
    Traduz todos os textos de um arquivo para o idioma alvo.
    Fluxo completo das etapas 4-6.
    """
    nome_idioma = NOME_IDIOMAS.get(idioma_alvo, idioma_alvo)
    
    # Carrega textos extraídos
    cache_path = os.path.join(PASTA_CACHE, f"{nome_arquivo}.json")
    if not os.path.exists(cache_path):
        print(f"  ⚠️ Cache não encontrado para {nome_arquivo}. Execute extract.py primeiro.")
        return None
    
    with open(cache_path, 'r', encoding='utf-8') as f:
        textos_extraidos = json.load(f)
    
    # Carrega cache permanente
    cache_permanente = carregar_cache_permanente()
    
    # Filtra: quais textos ainda precisam ser traduzidos?
    pendentes = []
    ja_traduzidos = {}
    
    for item in textos_extraidos:
        texto = item['texto_original']
        traducao = verificar_cache(texto, idioma_alvo, cache_permanente)
        
        if traducao is not None:
            ja_traduzidos[item['id']] = traducao
        else:
            pendentes.append({
                'id_original': item['id'],
                'texto': texto,
                'item': item,
            })
    
    print(f"  📋 {len(ja_traduzidos)} já no cache, {len(pendentes)} pendentes")
    
    if not pendentes:
        # Tudo já está no cache — só retorna
        resultado = {}
        for item in textos_extraidos:
            resultado[item['id']] = ja_traduzidos.get(
                item['id'],
                verificar_cache(item['texto_original'], idioma_alvo, cache_permanente) or item['texto_original']
            )
        return resultado
    
    # Etapa 4: gera arquivo temporário
    gerar_arquivo_temporario(pendentes)
    print(f"  📄 Arquivo temporário gerado: {len(pendentes)} textos")
    
    # Divide em lotes
    lotes = dividir_em_lotes(pendentes)
    print(f"  📦 {len(lotes)} lotes (até {MAX_TEXTOS_POR_LOTE} textos ou {MAX_CHARS_POR_LOTE} chars cada)")
    
    # Etapa 5: traduz via APIs
    print(f"  🚀 Enviando para APIs (DeepSeek ↔ OpenAI, 10 blocos, retry {MAX_TENTATIVAS}x)...")
    traducoes_api = traduzir_lotes(lotes, idioma_alvo, nome_idioma)
    
    # Etapa 6: atualiza cache permanente
    novos = 0
    for item in pendentes:
        id_original = item['id_original']
        if id_original in traducoes_api:
            texto_original = item['texto']
            texto_traduzido = traducoes_api[id_original]
            if texto_traduzido and texto_traduzido != texto_original:
                atualizar_cache(texto_original, idioma_alvo, texto_traduzido, cache_permanente)
                novos += 1
    
    if novos > 0:
        salvar_cache_permanente(cache_permanente)
        print(f"  💾 {novos} novas traduções salvas no cache permanente")
    
    # Monta resultado final (cache + API)
    resultado = {}
    for item in textos_extraidos:
        id_original = item['id']
        
        if id_original in traducoes_api:
            resultado[id_original] = traducoes_api[id_original]
        elif id_original in ja_traduzidos:
            resultado[id_original] = ja_traduzidos[id_original]
        else:
            resultado[id_original] = item['texto_original']
    
    return resultado


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Uso: python translate.py <arquivo.html> <idioma>")
        print("Ex:  python translate.py waterlow.html en")
        sys.exit(1)
    
    arquivo = sys.argv[1]
    idioma = sys.argv[2]
    
    print("=" * 60)
    print(f"🌐 TRANSLATE — {arquivo} → {idioma}")
    print("=" * 60)
    
    resultado = traduzir_arquivo(arquivo, idioma)
    if resultado:
        print(f"\n✅ {len(resultado)} textos processados para {idioma}")
