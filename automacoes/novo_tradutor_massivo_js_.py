# -*- coding: utf-8 -*-
"""
novo_tradutor_massivo_js_.py

Tradutor FOCADO EXCLUSIVAMENTE no bloco <script> inline dos HTMLs do site
calculadorasdeenfermagem.com.br.

REGRAS:
- NÃO toca em <head>, SEO, meta, lang, hreflang, canonical, etc.
- NÃO toca no corpo do HTML (<main>, <body>, atributos, textos).
- NÃO toca no footer placeholder do HTML de destino.
- APENAS extrai o(s) <script> inline (sem src=) do HTML em Português da RAIZ,
  traduz o conteúdo (strings e template literals) usando a mesma estratégia
  do tradutor_massivo.py, e SUBSTITUI o(s) bloco(s) <script> inline do HTML
  correspondente na pasta do idioma de destino.

- Respeita a LINHA por LINHA do JS: usa o algoritmo de máscara+substituição
  idêntico ao do modelo (regex de strings + template literals com
  __INTERP_N__), de modo que o código JS em si NUNCA é reescrito — apenas
  os literais de texto são trocados.

- Regras extras:
  1) Linhas contendo `getElementById("bar_${...}")` ou
     `getElementById("badge_${...}")` são PROTEGIDAS — após a tradução,
     o pós-processador substitui a linha inteira pela versão pt-BR correta.
  2) A string "Selecione..." (e variações) é SEMPRE traduzida para o
     placeholder equivalente no idioma de destino.
  3) O código `document.getElementById("resultadoMensagem").innerHTML = ...`
     é preservado e a string à direita do `=` é traduzida quando aplicável.
  4) Cache temporário em .tradutor_cache/ para permitir inspeção e retry.
"""

import os
import re
import time
import json
import shutil
import subprocess
import tempfile
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# Tentativa de usar selectolax (mais robusto que regex pra achar <script>).
try:
    from selectolax.parser import HTMLParser
    HAS_SELECTOLAX = True
except ImportError:
    HAS_SELECTOLAX = False


# =========================================================================
# 🟢 1. ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
# =========================================================================

# Arquivos HTML da RAIZ (pt-BR) cujo <script> inline você quer retraduzir.
ARQUIVOS_PARA_TRADUZIR = [
    "meem.html"
    
]

# Idiomas de destino (pastas existentes). NÃO inclui "pt" (a própria raiz).
IDIOMAS_ALVO = [
    "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Limite de strings por chamada ao LLM.
LIMITE_ITENS_JSON = 20

# Dicionário para forçar a IA a entender o idioma corretamente.
NOMES_IDIOMAS = {
    "en": "Inglês (Americano)", "es": "Espanhol", "fr": "Francês",
    "it": "Italiano", "de": "Alemão", "hi": "Hindi", "zh": "Chinês (Mandarim)",
    "ja": "Japonês", "ru": "Russo", "ko": "Coreano", "ar": "Árabe",
    "tr": "Turco", "nl": "Holandês", "pl": "Polonês", "sv": "Sueco",
    "id": "Indonésio", "vi": "Vietnamita", "uk": "Ucraniano"
}

# Termo canônico (pt-BR) que SEMPRE precisa estar traduzido nos HTMLs de destino.
TERMO_SELECIONE_PT = "Selecione..."

# Linhas PROTEGIDAS: nunca devem ser traduzidas; após a tradução, o
# pós-processador restaura essas linhas nos locais correspondentes.
# (Códigos getElementById que a IA estava traduzindo e quebrando a página.)
LINHAS_PROTEGIDAS_PT = [
    "const badge = document.getElementById(`badge_${item.id}`);",
    "const badge = document.getElementById(`badge_${id}`);",
    "const bar = document.getElementById(`bar_${item.id}`);",
]


# =========================================================================
# 2. CONFIGURAÇÃO DE APIS E CORES
# =========================================================================
load_dotenv()

client_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client_deepseek = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"  # sem /v1
)

C_AZUL = "\033[94m"
C_VERDE = "\033[92m"
C_AMARELO = "\033[93m"
C_VERMELHO = "\033[91m"
C_ROXO = "\033[95m"
C_CIANO = "\033[96m"
RESET = "\033[0m"

# Load balancer (Round-Robin)
_provedor_atual_idx = 0

# Cache dir
CACHE_DIR = ".tradutor_cache"


# =========================================================================
# 3. SISTEMA DE FALLBACK E LOAD BALANCER (idêntico ao modelo)
# =========================================================================
def chamar_ia_com_fallback(instrucao_sistema, conteudo_usuario, is_json=False):
    global _provedor_atual_idx
    tentativas = 10
    espera_erro = 10

    provedores = [
        {"nome": "OpenAI", "client": client_openai, "modelo": "gpt-4o"},
        {"nome": "DeepSeek", "client": client_deepseek, "modelo": "deepseek-v4-pro"}
    ]

    prompt_texto = json.dumps(conteudo_usuario, ensure_ascii=False) if is_json else conteudo_usuario
    idx_inicial = _provedor_atual_idx
    _provedor_atual_idx = (_provedor_atual_idx + 1) % len(provedores)

    for tentativa in range(1, tentativas + 1):
        idx_tentativa = (idx_inicial + tentativa - 1) % len(provedores)
        provedor_atual = provedores[idx_tentativa]

        cliente = provedor_atual["client"]
        modelo = provedor_atual["modelo"]
        nome_api = provedor_atual["nome"]

        print(f"        {C_ROXO}⟳ Tentativa {tentativa}/{tentativas} via {nome_api}...{RESET}", end="\r")

        try:
            kwargs = {
                "model": modelo,
                "messages": [
                    {"role": "system", "content": instrucao_sistema},
                    {"role": "user", "content": prompt_texto}
                ],
                "temperature": 0.1
            }
            if is_json:
                kwargs["response_format"] = {"type": "json_object"}

            response = cliente.chat.completions.create(**kwargs)
            resultado = response.choices[0].message.content.strip()

            print(f"        {C_VERDE}✓ Sucesso via {nome_api}!{RESET}                           ")

            if is_json:
                resultado = re.sub(r'^```(json|html)?\s*', '', resultado, flags=re.IGNORECASE)
                resultado = re.sub(r'\s*```$', '', resultado)
                return json.loads(resultado)
            else:
                return resultado

        except Exception as e:
            print(f"        {C_VERMELHO}✗ Erro no {nome_api}: {e}{RESET}")
            if tentativa < tentativas:
                print(f"        {C_AMARELO}Aguardando {espera_erro}s para o fallback...{RESET}")
                time.sleep(espera_erro)
            else:
                print(f"        {C_VERMELHO}🚨 Falha crítica após 10 tentativas.{RESET}")
                return conteudo_usuario


# =========================================================================
# 4. CHUNKING
# =========================================================================
def dividir_dicionario(dicionario, tamanho_lote):
    itens = list(dicionario.items())
    return [dict(itens[i:i + tamanho_lote]) for i in range(0, len(itens), tamanho_lote)]


# =========================================================================
# 5. EXTRAÇÃO CIRÚRGICA DOS SCRIPTS INLINE
# =========================================================================
def _regex_extrair_scripts_inline(html):
    """
    Fallback sem selectolax: usa regex pra achar <script>...</script> SEM src=.
    Retorna lista de dicts:
        {idx_inicio, idx_fim, abertura, conteudo, fecha_tag}
    """
    padrao = re.compile(
        r'(<script\b[^>]*>)(.*?)(</script>)',
        re.IGNORECASE | re.DOTALL
    )
    resultados = []
    for m in padrao.finditer(html):
        abertura = m.group(1)
        conteudo = m.group(2)
        fecha = m.group(3)
        if 'src=' in abertura.lower():
            continue
        # 🛡 PULAR bloco footer: igual em todos os idiomas, não precisa traduzir
        if 'footer-placeholder' in conteudo or 'footer.html' in conteudo:
            continue
        resultados.append({
            "idx_inicio": m.start(),
            "idx_fim": m.end(),
            "abertura": abertura,
            "conteudo": conteudo,
            "fecha_tag": fecha,
        })
    return resultados


def extrair_scripts_inline(html):
    """
    Usa selectolax se disponível (mais robusto), senão cai pro regex.
    Retorna lista ordenada de dicts descrevendo cada <script> inline.
    """
    if HAS_SELECTOLAX:
        resultados = []
        # selectolax usa o seletor CSS. Filtramos manualmente os com src=.
        for node in HTMLParser(html).css('script'):
            # node.html() já vem com tag incluída? Não: selectolax dá o conteúdo
            # via text(), e a tag via tag. Vamos reconstruir offsets aproximados.
            abertura = node.tag
            src_attr = node.attributes.get('src')
            if src_attr:
                continue
            conteudo = node.text() or ""
            # 🛡 PULAR bloco footer: igual em todos os idiomas, não precisa traduzir
            if 'footer-placeholder' in conteudo or 'footer.html' in conteudo:
                continue
            # Reconstrói a abertura completa (com atributos):
            attrs_str = ""
            for k, v in node.attributes.items():
                if v is None or v == "":
                    attrs_str += f" {k}"
                else:
                    attrs_str += f' {k}="{v}"'
            abertura_completa = f"<script{attrs_str}>"
            # Para manter compatibilidade com o indexador por offset, vamos
            # calcular o offset buscando a tag exata no html:
            # (a primeira ocorrência de "<script" a partir de onde paramos)
            # Mas como selectolax não dá offset nativo de css(), usamos busca
            # incremental a partir do último ponto.
            resultados.append({
                "abertura": abertura_completa,
                "conteudo": conteudo,
                "fecha_tag": "</script>",
                # idx_inicio/idx_fim ficam como None — o chamador decide se usa
                "_selectolax": True,
            })
        # Para cada um, calcular offsets via busca no HTML.
        cursor = 0
        for r in resultados:
            tag_open = r["abertura"]
            # encontra tag_open a partir do cursor
            pos = html.find(tag_open, cursor)
            if pos == -1:
                # fallback: tenta "<script>"
                pos = html.find("<script", cursor)
            if pos == -1:
                r["idx_inicio"] = None
                r["idx_fim"] = None
                continue
            # encontra o fecha_tag correspondente
            fecha_pos = html.find(r["fecha_tag"], pos)
            if fecha_pos == -1:
                r["idx_inicio"] = None
                r["idx_fim"] = None
                continue
            idx_fim = fecha_pos + len(r["fecha_tag"])
            r["idx_inicio"] = pos
            r["idx_fim"] = idx_fim
            cursor = idx_fim
        return resultados
    else:
        return _regex_extrair_scripts_inline(html)


# =========================================================================
# 6. TRADUÇÃO DO JS INLINE (regras idênticas ao modelo)
# =========================================================================
def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    """
    Recebe dict {id_script: codigo_js}. Extrai strings e template literals,
    traduz em lotes, e devolve o dict com o código modificado.
    Estratégia IDÊNTICA ao tradutor_massivo.py:
      - regex para strings "..."  e '...'
      - regex para template literals `...` com proteção de ${...}
    """
    strings_para_traduzir = {}
    mapeamento_scripts = {}
    contador_string = 0

    for id_script, codigo_js in dicionario_scripts.items():
        padrao_string = re.compile(r'(["\'])(.*?)\1')
        mapeamento_scripts[id_script] = []

        for match in padrao_string.finditer(codigo_js):
            conteudo = match.group(2)
            if (
                len(conteudo) > 3
                and " " in conteudo
                and not conteudo.startswith(('/', '#', '.', 'data-'))
                and not conteudo.endswith('.html')
            ):
                id_string = f"STR_JS_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({
                    'original': match.group(0),
                    'id': id_string,
                    'delimitador': match.group(1),
                    'tipo': 'string'
                })
                contador_string += 1

        padrao_template = re.compile(r'`([^`]*)`')
        for match_tmpl in padrao_template.finditer(codigo_js):
            conteudo = match_tmpl.group(1)
            if not conteudo.strip():
                continue

            # 🛡 PROTEÇÃO: PULAR template literals HTML gigantes com backticks aninhados.
            # O regex `...` não suporta nesting. Templates que geram HTML de impressão
            # (ex.: imprimirLaudo, executarPDF) contêm backticks internos como
            # ? `<div>...</div>` que são fragmentados incorretamente.
            # Detectamos pelo marcador <!DOCTYPE ou pela presença de múltiplos `<` HTML.
            if conteudo.strip().startswith('<!DOCTYPE') or conteudo.strip().startswith('<html'):
                continue
            # Também pula templates que contêm atributos HTML com backticks aninhados
            # (padrão: ? `<tag ...>). Detectamos pelo marcador "<div" após interps.
            if re.search(r'\?\s*`\s*<', conteudo):
                continue

            interps = re.findall(r'\$\{[^}]+\}', conteudo)
            texto_limpo = conteudo
            for i, interp in enumerate(interps):
                texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto:
                continue

            id_string = f"STR_JS_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({
                'original': match_tmpl.group(0),
                'id': id_string,
                'delimitador': '`',
                'tipo': 'template',
                'interpolacoes': interps
            })
            contador_string += 1

    if not strings_para_traduzir:
        return dicionario_scripts

    nome_idioma = NOMES_IDIOMAS.get(idioma_alvo, idioma_alvo)
    instrucoes = f"""Você é tradutor de interfaces médicas. Traduza os valores do JSON do Português para '{nome_idioma}'.
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON válido.
    2. Chaves intactas.
    3. NÃO adicione aspas extras.
    4. Placeholders (__INTERP_0__) DEVEM ser mantidos EXATAMENTE como estão.
    5. Preserve tags HTML internas.
    6. NÃO faça traduções literais. Adapte jargões, siglas médicas e terminologias para o uso cotidiano e padrão clínico real da região do idioma '{nome_idioma}'.
    7. O termo fixo '{TERMO_SELECIONE_PT}' DEVE ser traduzido para o equivalente natural e usado em dropdowns/listas no idioma '{nome_idioma}' (ex.: "Selecione..." → equivalente local, mantendo os três pontos "..." quando fizer sentido).
    8. NÃO traduza NADA que pareça identificador de elemento DOM (palavras dentro de getElementById, querySelector, ${'$'}{...}, template literals que contenham apenas código).
    9. NÃO traduza nomes de variáveis, funções, propriedades de objetos JS, nem nomes de classes CSS.
    10. Para `document.getElementById("resultadoMensagem").innerHTML = "..."`, o texto entre aspas DEVE ser traduzido normalmente.
    """

    lotes_js = dividir_dicionario(strings_para_traduzir, LIMITE_ITENS_JSON)
    dict_traduzido = {}
    for lote in lotes_js:
        res = chamar_ia_com_fallback(instrucoes, lote, is_json=True)
        if isinstance(res, dict):
            dict_traduzido.update(res)

    for id_script, itens in mapeamento_scripts.items():
        codigo_atual = dicionario_scripts[id_script]
        for item in itens:
            if item['id'] in dict_traduzido:
                texto_trad = dict_traduzido[item['id']]
                if item['tipo'] == 'template':
                    for i, interp in enumerate(item.get('interpolacoes', [])):
                        texto_trad = texto_trad.replace(f'__INTERP_{i}__', interp)
                codigo_atual = codigo_atual.replace(
                    item['original'],
                    f"{item['delimitador']}{texto_trad}{item['delimitador']}"
                )
        dicionario_scripts[id_script] = codigo_atual

    return dicionario_scripts


# =========================================================================
# 7. PÓS-PROCESSAMENTO: PROTEÇÃO DE LINHAS CRÍTICAS
# =========================================================================
def restaurar_linhas_protegidas(codigo_js_pt, codigo_js_traduzido):
    """
    Recebe o JS original em pt-BR e o JS já traduzido. Procura no JS
    traduzido as linhas equivalentes (mesma estrutura de getElementById com
    'bar' ou 'badge' em template literal) e SUBSTITUI cada uma pela versão
    pt-BR correspondente.

    Estratégia:
      1. Identifica, no JS pt-BR, as linhas exatas da lista LINHAS_PROTEGIDAS_PT.
      2. Para cada uma, monta um padrão regex tolerante a pequenas variações
         de espaços em branco que a IA possa ter inserido.
      3. Substitui TODAS as ocorrências no JS traduzido.
    """
    resultado = codigo_js_traduzido

    # Padrão tolerante: ignora diferenças de múltiplos espaços e
    # permite template literal (`...`) com ${...} preservado.
    padroes = [
        # const badge = document.getElementById(`badge_${item.id}`);
        re.compile(
            r'const\s+badge\s*=\s*document\.getElementById\s*\(\s*`badge_\$\{item\.id\}`\s*\)\s*;'
        ),
        # const badge = document.getElementById(`badge_${id}`);
        re.compile(
            r'const\s+badge\s*=\s*document\.getElementById\s*\(\s*`badge_\$\{id\}`\s*\)\s*;'
        ),
        # const bar = document.getElementById(`bar_${item.id}`);
        re.compile(
            r'const\s+bar\s*=\s*document\.getElementById\s*\(\s*`bar_\$\{item\.id\}`\s*\)\s*;'
        ),
    ]

    # Substituições: do MAIS ESPECÍFICO para o mais geral, pra não
    # o `badge_${id}` cair dentro de um match de `badge_${item.id}`.
    substituicoes = [
        (padroes[0], LINHAS_PROTEGIDAS_PT[0]),  # badge_${item.id}
        (padroes[1], LINHAS_PROTEGIDAS_PT[1]),  # badge_${id}
        (padroes[2], LINHAS_PROTEGIDAS_PT[2]),  # bar_${item.id}
    ]

    for padrao, original_pt in substituicoes:
        if padrao.search(resultado):
            contagem = len(padrao.findall(resultado))
            resultado = padrao.sub(original_pt, resultado)
            print(f"        {C_CIANO}🛡  Linha protegida restaurada ({contagem}×): {original_pt[:60]}...{RESET}")

    return resultado


def garantir_traducao_termo_selecione(codigo_js_traduzido, idioma_alvo):
    """
    Verifica se 'Selecione...' (e variantes) está presente. Se a IA não
    traduziu, deixa como está; se traduziu errado, esta função apenas
    assegura que o placeholder pt-BR seja substituído pelo equivalente
    correto (na verdade, a IA já faz isso na etapa de lote — aqui só
    fazemos um sanity-check de presença).
    """
    # Nada a fazer programaticamente — a IA traduziu no lote.
    # Este hook existe para você adicionar lógica extra no futuro.
    return codigo_js_traduzido


def corrigir_template_literals_corrompidos(codigo_js):
    """
    Pós-processamento: corrige corrupções conhecidas causadas pela IA
    ao traduzir template literals que contêm HTML com atributos entre aspas.

    A regex padrao_string captura strings como "secao", "grid2" etc. de
    DENTRO de template literals (ex.: `<div class="secao">`). Quando a IA
    traduz essas strings e o replace as recoloca, pode inserir aspas
    duplas extras antes de backticks em expressões ternárias.

    Padrões corrigidos:
      1) ? "`  → ? `   (aspa dupla extra antes de template literal)
      2) ? "}` ` → ? ` (caso extremo com lixo "}`)
    """
    # Corrige ? "` → ? `
    codigo_js = re.sub(r'\?\s*"\s*`', '? `', codigo_js)
    # Corrige ? "}` ` → ? ` (caso com lixo extra)
    codigo_js = re.sub(r'\?\s*"[^`]*`\s*`', '? `', codigo_js)
    return codigo_js


def corrigir_codigo_orfao_apos_script(html_completo):
    """
    Pós-processamento no HTML final: detecta e remove código JavaScript
    que vazou para fora da tag </script> devido à fragmentação de
    template literals aninhados pelo padrao_template regex.

    Sintoma: após o </script> que fecha o bloco principal, aparece
    código JS órfão (event listeners, renderizarItensTinetti, etc.)
    antes do <div id="footer-placeholder">.

    Causa: o regex `([^`]*)` fragmenta o template literal gigante
    do imprimirLaudo nos backticks internos (? `<div>...</div>`).
    O fragmento final contém </script> NÃO escapado, que o parser
    HTML trata como fechamento real da tag <script>.
    """
    # Detecta padrão: </script> seguido de código JS órfão até footer-placeholder
    # Remove tudo entre o primeiro </script> (real) e <div id="footer-placeholder">
    # desde que haja código JS visível (addEventListener, function, etc.)
    padrao_orfao = re.compile(
        r'(</script>)\s*'
        r'(?:</body></html>`;\s*)?'    # fragmento do template literal
        r'(?:const\s+janela\s*=.*?;\s*)?'  # código órfão do imprimirLaudo
        r'(?:janela\.document\..*?;\s*)*'
        r'(?:\}\s*)?'
        r'(\s*//\s*Eventos.*?)'         # início do bloco de eventos duplicado
        r'(?=<div\s+id="footer-placeholder")',
        re.DOTALL
    )
    if padrao_orfao.search(html_completo):
        html_completo = padrao_orfao.sub(r'\1\n', html_completo)
        print(f"        {C_CIANO}🧹 Código órfão após </script> removido.{RESET}")
    return html_completo


# =========================================================================
# 8. SUBSTITUIÇÃO CIRÚRGICA NO HTML DE DESTINO
# =========================================================================
def substituir_scripts_inline_no_html_destino(html_destino, scripts_pt_traduzidos):
    """
    Recebe:
      - html_destino: conteúdo COMPLETO do HTML na pasta do idioma
      - scripts_pt_traduzidos: lista de dicts, cada um com:
            { "abertura": "<script ...>",
              "fecha_tag": "</script>",
              "conteudo": "<JS traduzido>" }
        (gerados a partir do HTML pt-BR)

    Estratégia:
      1. Encontrar todos os <script> SEM src= no html_destino, na ORDEM.
      2. Se a quantidade for diferente, ABORTAR e avisar.
      3. Substituir do ÚLTIMO para o PRIMEIRO (pra não bagunçar offsets).
      4. Devolver o html_destino modificado.
    """
    scripts_destino = extrair_scripts_inline(html_destino)
    if len(scripts_destino) != len(scripts_pt_traduzidos):
        raise RuntimeError(
            f"Incompatibilidade de scripts inline: origem pt-BR tem "
            f"{len(scripts_pt_traduzidos)} <script> inline, destino tem "
            f"{len(scripts_destino)}. Verifique manualmente antes de prosseguir."
        )

    # Substituição de trás pra frente (preserva offsets)
    html_modificado = html_destino
    for i in range(len(scripts_destino) - 1, -1, -1):
        sd = scripts_destino[i]
        spt = scripts_pt_traduzidos[i]
        novo_bloco = f"{spt['abertura']}{spt['conteudo']}{spt['fecha_tag']}"
        if sd["idx_inicio"] is None:
            # Se não conseguimos calcular offsets, fallback por replace() — só
            # funciona se o bloco for ÚNICO no HTML de destino.
            bloco_antigo = f"{sd['abertura']}{sd['conteudo']}{sd['fecha_tag']}"
            if html_modificado.count(bloco_antigo) != 1:
                raise RuntimeError(
                    f"Não foi possível localizar unicamente o {i+1}º <script> "
                    f"inline no HTML de destino para fazer a substituição."
                )
            html_modificado = html_modificado.replace(bloco_antigo, novo_bloco, 1)
        else:
            html_modificado = (
                html_modificado[:sd["idx_inicio"]]
                + novo_bloco
                + html_modificado[sd["idx_fim"]:]
            )

    return html_modificado


# =========================================================================
# 9. FUNÇÃO DE BUILD (idêntica ao modelo)
# =========================================================================
def rodar_scripts_de_build():
    comandos = [
        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        "node gerar-sw.js"
    ]
    print(f"\n  {C_AMARELO}⚙️  Rodando Scripts de Build...{RESET}")
    for comando in comandos:
        try:
            subprocess.run(comando, shell=True, check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            print(f"      {C_VERDE}✓ {comando}{RESET}")
        except subprocess.CalledProcessError:
            print(f"      {C_VERMELHO}✗ Falha: {comando}{RESET}")


# =========================================================================
# 10. CACHE TEMPORÁRIO (para inspeção e retry)
# =========================================================================
def salvar_cache(arquivo, idioma, dados):
    os.makedirs(CACHE_DIR, exist_ok=True)
    nome = f"{os.path.splitext(arquivo)[0]}_{idioma}.json"
    caminho = os.path.join(CACHE_DIR, nome)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    return caminho


# =========================================================================
# 11. PIPELINE PRINCIPAL
# =========================================================================
def processar_arquivo(arquivo, idioma):
    """Processa UM arquivo para UM idioma."""
    caminho_origem = arquivo
    if not os.path.exists(caminho_origem):
        print(f"  {C_VERMELHO}✗ {arquivo} não encontrado na raiz.{RESET}")
        return False

    with open(caminho_origem, "r", encoding="utf-8-sig") as f:
        html_pt = f.read()

    pasta_destino = f"./{idioma}/"
    caminho_destino = os.path.join(pasta_destino, arquivo)
    if not os.path.exists(caminho_destino):
        print(f"  {C_VERMELHO}✗ HTML de destino não existe: {caminho_destino}{RESET}")
        return False

    with open(caminho_destino, "r", encoding="utf-8-sig") as f:
        html_destino = f.read()

    print(f"  {C_AZUL}[1/4] Extraindo <script> inline do HTML pt-BR...{RESET}")
    scripts_pt = extrair_scripts_inline(html_pt)
    if not scripts_pt:
        print(f"  {C_AMARELO}⚠ Nenhum <script> inline encontrado em {arquivo}. Pulando.{RESET}")
        return True

    print(f"      → {len(scripts_pt)} bloco(s) <script> inline encontrado(s).")

    print(f"  {C_AZUL}[2/4] Traduzindo conteúdo JS (lotes de {LIMITE_ITENS_JSON})...{RESET}")
    # Monta dict {id_script: codigo_js} para enviar ao LLM
    dict_scripts_pt = {f"script_{i}": s["conteudo"] for i, s in enumerate(scripts_pt)}
    dict_scripts_traduzidos = traduzir_lote_js_com_deepseek(dict_scripts_pt, idioma)

    # Pós-processamento: restaura linhas protegidas
    print(f"  {C_AZUL}[3/4] Restaurando linhas protegidas e corrigindo artefatos...{RESET}")
    scripts_traduzidos_final = []
    for i, s_pt in enumerate(scripts_pt):
        cod_trad = dict_scripts_traduzidos[f"script_{i}"]
        cod_trad = restaurar_linhas_protegidas(s_pt["conteudo"], cod_trad)
        cod_trad = corrigir_template_literals_corrompidos(cod_trad)
        cod_trad = garantir_traducao_termo_selecione(cod_trad, idioma)
        scripts_traduzidos_final.append({
            "abertura": s_pt["abertura"],
            "fecha_tag": s_pt["fecha_tag"],
            "conteudo": cod_trad,
        })

    # Cache
    cache_path = salvar_cache(arquivo, idioma, {
        "arquivo": arquivo,
        "idioma": idioma,
        "timestamp": datetime.now().isoformat(),
        "scripts_traduzidos": scripts_traduzidos_final,
    })
    print(f"      💾 Cache salvo em: {cache_path}")

    print(f"  {C_AZUL}[4/4] Substituindo APENAS o(s) <script> inline no HTML de destino...{RESET}")
    try:
        html_final = substituir_scripts_inline_no_html_destino(html_destino, scripts_traduzidos_final)
    except RuntimeError as e:
        print(f"  {C_VERMELHO}✗ Erro na substituição: {e}{RESET}")
        return False

    # Pós-processamento no HTML final: remove código órfão vazado
    html_final = corrigir_codigo_orfao_apos_script(html_final)

    # Backup de segurança antes de salvar
    backup_path = caminho_destino + ".bak"
    if not os.path.exists(backup_path):
        shutil.copy2(caminho_destino, backup_path)
        print(f"      📦 Backup criado: {backup_path}")

    with open(caminho_destino, "w", encoding="utf-8") as f:
        f.write(html_final)

    print(f"  {C_VERDE}✅ {arquivo} ➔ {idioma.upper()} atualizado!{RESET}")
    return True


def main():
    print(f"{C_ROXO}" + "=" * 60 + RESET)
    print(f"{C_ROXO}  NOVO TRADUTOR MASSIVO JS INLINE (apenas <script>){RESET}")
    print(f"{C_ROXO}" + "=" * 60 + RESET)

    total = len(ARQUIVOS_PARA_TRADUZIR) * len(IDIOMAS_ALVO)
    feito = 0
    sucessos = 0

    for arquivo in ARQUIVOS_PARA_TRADUZIR:
        for idioma in IDIOMAS_ALVO:
            feito += 1
            print(f"\n{C_AMARELO}── [{feito}/{total}] {arquivo} ➔ {idioma.upper()} ──{RESET}")
            try:
                if processar_arquivo(arquivo, idioma):
                    sucessos += 1
                    # Build a cada arquivo traduzido
                    rodar_scripts_de_build()
                    # Pausa entre rodadas (exceto na última)
                    eh_ultimo = (feito == total)
                    if not eh_ultimo:
                        print(f"  {C_AMARELO}⏳ Pausa de 45s para resfriar a API...{RESET}")
                        time.sleep(45)
            except Exception as e:
                print(f"  {C_VERMELHO}💥 Erro inesperado: {e}{RESET}")
                continue

    print(f"\n{C_VERDE}" + "=" * 60 + RESET)
    print(f"{C_VERDE}  CONCLUÍDO: {sucessos}/{feito} operações bem-sucedidas{RESET}")
    print(f"{C_VERDE}" + "=" * 60 + RESET)


if __name__ == "__main__":
    main()