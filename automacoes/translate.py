import os
import re
import time
import json
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# =========================================================================
# 🟢 1. ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
# =========================================================================

# Arquivos que você quer traduzir APENAS O JS INLINE (coloque um ou vários)
ARQUIVOS_PARA_TRADUZIR = [
    "fast.html"
]

# Idiomas de destino
IDIOMAS_ALVO = [
    "es"
]

# Limites de Tokens / Blocos (Ajuste se necessário)
LIMITE_ITENS_JSON = 20 # Quantas strings JS traduzir por vez no Lote

# Dicionário para forçar a IA a entender o idioma corretamente
NOMES_IDIOMAS = {
    "en": "Inglês (Americano)", "es": "Espanhol", "fr": "Francês",
    "it": "Italiano", "de": "Alemão", "hi": "Hindi", "zh": "Chinês (Mandarim)",
    "ja": "Japonês", "ru": "Russo", "ko": "Coreano", "ar": "Árabe",
    "tr": "Turco", "nl": "Holandês", "pl": "Polonês", "sv": "Sueco",
    "id": "Indonésio", "vi": "Vietnamita", "uk": "Ucraniano"
}

# =========================================================================
# 2. CONFIGURAÇÃO DE APIS E CORES
# =========================================================================
load_dotenv()

client_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client_deepseek = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com" # Sem /v1 conforme doc oficial
)

C_AZUL = "\033[94m"
C_VERDE = "\033[92m"
C_AMARELO = "\033[93m"
C_VERMELHO = "\033[91m"
C_ROXO = "\033[95m"
RESET = "\033[0m"

# Load balancer (Round-Robin)
_provedor_atual_idx = 0

# =========================================================================
# 3. SISTEMA DE FALLBACK E LOAD BALANCER
# =========================================================================
def chamar_ia_com_fallback(instrucao_sistema, conteudo_usuario, is_json=False):
    global _provedor_atual_idx
    tentativas = 10
    espera_erro = 10
    
    provedores = [
        {"nome": "OpenAI", "client": client_openai, "modelo": "gpt-4o"},
        {"nome": "DeepSeek", "client": client_deepseek, "modelo": "deepseek-chat"} # Ajustado para deepseek-chat (modelo padrão da v3)
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
            if is_json: kwargs["response_format"] = {"type": "json_object"}

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
# 5. EXTRAÇÃO E TRADUÇÃO CIRÚRGICA DE JS
# =========================================================================
def extrair_scripts_inline(html):
    """Extrai apenas os blocos <script> que não possuem 'src='."""
    # Group 1: Abertura da tag (<script...>)
    # Group 2: O código JS (conteúdo)
    # Group 3: Fechamento da tag (</script>)
    padrao_script = re.compile(r'(<script\b(?![^>]*\bsrc=)[^>]*>)(.*?)(</script>)', re.IGNORECASE | re.DOTALL)
    
    scripts_extraidos = {}
    for i, match in enumerate(padrao_script.finditer(html)):
        scripts_extraidos[f"SCRIPT_INLINE_{i}"] = match.group(2) # Captura apenas o miolo do script
        
    return scripts_extraidos, padrao_script

def traduzir_lote_js_com_ia(dicionario_scripts, idioma_alvo):
    strings_para_traduzir = {}
    mapeamento_scripts = {}
    contador_string = 0

    # Mapear as strings e templates de todos os scripts
    for id_script, codigo_js in dicionario_scripts.items():
        mapeamento_scripts[id_script] = []

        # 1. Capturar aspas simples e duplas normais
        padrao_string = re.compile(r'(["\'])(.*?)\1')
        for match in padrao_string.finditer(codigo_js):
            conteudo = match.group(2)
            # Ignora strings muito curtas, caminhos, seletores css, atributos de data
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_JS_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({'original': match.group(0), 'id': id_string, 'delimitador': match.group(1), 'tipo': 'string'})
                contador_string += 1

        # 2. Capturar Template Literals (Crasis `...`)
        padrao_template = re.compile(r'`([^`]*)`')
        for match_tmpl in padrao_template.finditer(codigo_js):
            conteudo = match_tmpl.group(1)
            if not conteudo.strip(): continue
            interps = re.findall(r'\$\{[^}]+\}', conteudo)
            texto_limpo = conteudo
            for i, interp in enumerate(interps): texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto: continue
            
            id_string = f"STR_JS_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({'original': match_tmpl.group(0), 'id': id_string, 'delimitador': '`', 'tipo': 'template', 'interpolacoes': interps})
            contador_string += 1

    if not strings_para_traduzir: return dicionario_scripts

    nome_idioma = NOMES_IDIOMAS.get(idioma_alvo, idioma_alvo)
    
    # REGRAS INEGOCIÁVEIS EXATAMENTE COMO PEDIDO
    instrucoes = f"""Você é especialista em SEO internacional e tradutor clínico na área da saúde. Traduza os valores do JSON do Português para '{nome_idioma}'.
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave da enfermagem/saúde local.
    2. NÃO modifique as chaves do JSON.
    3. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem marcações markdown.
    4. NÃO faça traduções literais. Utilize a terminologia médica e de enfermagem mais atualizada, regionalmente correta e de uso cotidiano no idioma de destino. Adapte siglas para o padrão local.
    5. Placeholders como (__INTERP_0__) DEVEM ser mantidos EXATAMENTE onde estão, pois representam variáveis dinâmicas do JavaScript.
    """
    
    lotes_js = dividir_dicionario(strings_para_traduzir, LIMITE_ITENS_JSON)
    dict_traduzido = {}
    for i, lote in enumerate(lotes_js):
        print(f"      ↳ Traduzindo lote JS {i+1}/{len(lotes_js)}...")
        res = chamar_ia_com_fallback(instrucoes, lote, is_json=True)
        if isinstance(res, dict): dict_traduzido.update(res)

    # Remontar os scripts com os textos traduzidos
    for id_script, itens in mapeamento_scripts.items():
        codigo_atual = dicionario_scripts[id_script]
        for item in reversed(itens): # Reverso para evitar conflito de index na substituição se houver strings aninhadas
            if item['id'] in dict_traduzido:
                texto_trad = dict_traduzido[item['id']]
                if item['tipo'] == 'template':
                    for i, interp in enumerate(item.get('interpolacoes', [])):
                        texto_trad = texto_trad.replace(f'__INTERP_{i}__', interp)
                codigo_atual = codigo_atual.replace(item['original'], f"{item['delimitador']}{texto_trad}{item['delimitador']}")
        dicionario_scripts[id_script] = codigo_atual
            
    return dicionario_scripts

# =========================================================================
# 6. FUNÇÃO DE BUILD
# =========================================================================
def rodar_scripts_de_build():
    comandos = [
        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        "node gerar-sw.js"
    ]
    print(f"\n  {C_AMARELO}⚙️ Rodando Scripts de Build (Tailwind / SW)...{RESET}")
    for comando in comandos:
        try:
            subprocess.run(comando, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            print(f"      {C_VERDE}✓ {comando}{RESET}")
        except subprocess.CalledProcessError:
            print(f"      {C_VERMELHO}✗ Falha: {comando}{RESET}")

# =========================================================================
# 7. FLUXO PRINCIPAL
# =========================================================================
def main():
    print(f"{C_ROXO}Iniciando Pipeline Focado em Substituição de JS Inline{RESET}")
    
    for arquivo in ARQUIVOS_PARA_TRADUZIR:
        if not os.path.exists(arquivo): 
            print(f"{C_VERMELHO}Arquivo base {arquivo} não encontrado na raiz.{RESET}")
            continue
        
        # 1. LER ARQUIVO RAIZ (PORTUGUÊS)
        with open(arquivo, 'r', encoding='utf-8-sig') as f:
            html_raiz_pt = f.read()

        # 2. EXTRAIR JS DA RAIZ
        scripts_pt_base, padrao_script_regex = extrair_scripts_inline(html_raiz_pt)

        if not scripts_pt_base:
            print(f"{C_AMARELO}Aviso: Nenhum JS inline encontrado em {arquivo}. Pulando.{RESET}")
            continue

        print(f"\n{C_AZUL}▶ Encontrado(s) {len(scripts_pt_base)} bloco(s) JS em {arquivo}. Iniciando lote de idiomas...{RESET}")

        for idioma in IDIOMAS_ALVO:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO: {arquivo} ➔ ATUALIZANDO JS NO IDIOMA: {idioma.upper()}{RESET}")
            
            caminho_alvo = f"./{idioma}/{arquivo}"
            
            if not os.path.exists(caminho_alvo):
                print(f"    {C_VERMELHO}Arquivo alvo não existe: {caminho_alvo}. Pulando este idioma.{RESET}")
                continue

            # 3. LER O ARQUIVO DE DESTINO (QUE SERÁ SUBSTITUÍDO PARCIALMENTE)
            with open(caminho_alvo, 'r', encoding='utf-8') as f:
                html_destino = f.read()

            # 4. TRADUZIR OS SCRIPTS BASE PARA O IDIOMA ATUAL
            print(f"    {C_ROXO}Traduzindo lógicas e templates do JS...{RESET}")
            scripts_traduzidos = traduzir_lote_js_com_ia(scripts_pt_base.copy(), idioma)

            # 5. INJETAR JS TRADUZIDO NO ARQUIVO DE DESTINO (SUBSTITUIÇÃO)
            contador_substituicao = 0
            def substituir_no_destino(match):
                nonlocal contador_substituicao
                chave = f"SCRIPT_INLINE_{contador_substituicao}"
                contador_substituicao += 1
                
                if chave in scripts_traduzidos:
                    # Retorna a tag de abertura original + NOVO JS TRADUZIDO + tag de fechamento original
                    return f"{match.group(1)}{scripts_traduzidos[chave]}{match.group(3)}"
                
                # Fallback de segurança: se houver descasamento, retorna o que já estava lá
                return match.group(0)

            # Aplica a substituição apenas nos blocos de script do arquivo alvo
            html_destino_final = padrao_script_regex.sub(substituir_no_destino, html_destino)

            # 6. SALVAR ARQUIVO ATUALIZADO
            with open(caminho_alvo, 'w', encoding='utf-8') as f:
                f.write(html_destino_final)
                
            print(f"\n{C_VERDE}✅ SUCESSO! Bloco JS substituído em: {caminho_alvo}{RESET}")
            
            # 7. EXECUTAR BUILD (TAILWIND + SW)
            rodar_scripts_de_build()
            
            # 8. PAUSA DE RESFRIAMENTO DE API
            if not (arquivo == ARQUIVOS_PARA_TRADUZIR[-1] and idioma == IDIOMAS_ALVO[-1]):
                print(f"  {C_AMARELO}⏳ Pausa de 45s para resfriar as APIs...{RESET}")
                time.sleep(45)

if __name__ == "__main__":
    main()