import os
import re
import json
import time
import requests
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Verifica a chave da API do DeepSeek
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
if not CHAVE_DEEPSEEK:
    raise ValueError("Chave do DeepSeek não encontrada. Adicione DEEPSEEK_API_KEY no arquivo .env.")

def extrair_textos_do_html(html):
    """
    Isola os textos puros do HTML (entre as tags) e os atributos cruciais (alt, aria-label, title).
    Retorna o HTML com placeholders de segurança e o dicionário de textos.
    """
    dicionario_textos = {}
    contador = [0]

    # 1. Extrair atributos importantes (alt, aria-label, title)
    def proteger_atributos(match):
        attr_name = match.group(1)
        texto = match.group(2)
        
        # Ignora se estiver vazio ou muito curto para ser texto real
        if len(texto.strip()) > 1 and re.search(r'[a-zA-ZÀ-ÿ]', texto):
            id_str = f"__STR_{contador[0]}__"
            dicionario_textos[id_str] = texto
            contador[0] += 1
            return f'{attr_name}="{id_str}"'
        return match.group(0)

    # Substitui os atributos usando a regex
    html_modificado = re.sub(r'(aria-label|alt|title)="([^"]+)"', proteger_atributos, html)

    # 2. Extrair os textos entre as tags HTML (>texto<)
    def proteger_texto_entre_tags(match):
        texto = match.group(1)
        
        # Ignora se for apenas espaços em branco, quebras de linha ou caracteres sem letras
        if len(texto.strip()) > 1 and re.search(r'[a-zA-ZÀ-ÿ]', texto):
            id_str = f"__STR_{contador[0]}__"
            texto_limpo = texto.strip()
            dicionario_textos[id_str] = texto_limpo
            
            # Mantém os espaços originais ao redor da string (antes e depois do texto real)
            espaco_antes = texto[:len(texto)-len(texto.lstrip())]
            espaco_depois = texto[len(texto.rstrip()):]
            
            contador[0] += 1
            return f">{espaco_antes}{id_str}{espaco_depois}<"
            
        return match.group(0)

    html_modificado = re.sub(r'>([^<]+)<', proteger_texto_entre_tags, html_modificado)

    return html_modificado, dicionario_textos


def ajustar_caminhos_do_menu(html, idioma_alvo):
    """
    Altera os caminhos absolutos base (ex: href="/index.html") para caminhos relativos
    da pasta do idioma alvo (ex: href="/fr/index.html").
    Ignora links que já tenham sido alterados ou que apontem para seções (href="#").
    """
    # Regex explica: 
    # href="/ 
    # (?!([a-z]{2}/)) -> Garante que não comece com algo como 'fr/' (lookahead negativo)
    # ([^"]+\.html)" -> Captura qualquer nome de arquivo que termine em .html e fecha as aspas
    regex_links = r'href="/(?!([a-z]{2}/))([^"]+\.html)"'
    
    # Substitui inserindo a pasta do idioma alvo. Ex: href="/fr/missao.html"
    html_ajustado = re.sub(regex_links, rf'href="/{idioma_alvo}/\2"', html)
    return html_ajustado


def traduzir_com_deepseek(dicionario_textos, idioma_alvo):
    """
    Envia o dicionário de textos puros para o DeepSeek processar a tradução.
    """
    if not dicionario_textos:
        return {}

    instrucoes_sistema = f"""
    Você é um tradutor especialista sênior em localização de interfaces digitais para a área de saúde, clínica médica e enfermagem.
    Sua tarefa é traduzir um dicionário JSON do Português Brasileiro para o idioma com a sigla '{idioma_alvo}'.
    
    REGRAS INEGOCIÁVEIS:
    1. Retorne EXCLUSIVAMENTE um JSON válido. Não inclua blocos markdown (como ```json) ou qualquer texto de explicação.
    2. NÃO modifique as chaves originais do JSON (ex: __STR_0__, __STR_1__). Modifique APENAS os valores.
    3. Respeite os jargões, a cultura médica e as siglas estabelecidas para os enfermeiros nativos deste idioma (Evite traduções puramente literais que soem artificiais no ambiente clínico).
    4. Mantenha eventuais pontuações ou caixa alta (Maiúsculas/Minúsculas) usadas no original para dar ênfase no menu.
    """
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": json.dumps(dicionario_textos, ensure_ascii=False)}
        ],
        "temperature": 0.1, # Temperatura baixa para garantir estabilidade do formato JSON e fidelidade
        "response_format": {"type": "json_object"}
    }

    print(f"      ↳ Enviando {len(dicionario_textos)} palavras/frases puras para o DeepSeek...")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso a IA teime em mandar markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        return traducoes
        
    except Exception as e:
        print(f"\n❌ Erro crítico ao traduzir os textos com DeepSeek: {e}")
        return {}


def restaurar_html(html_modificado, dicionario_traduzido):
    """
    Substitui os placeholders do HTML (__STR_X__) pelo texto final traduzido pela IA.
    """
    html_final = html_modificado
    for chave_id, texto_traduzido in dicionario_traduzido.items():
        # Corrige aspas não escapadas que poderiam quebrar propriedades HTML como aria-label
        texto_seguro = texto_traduzido.replace('"', "'")
        html_final = html_final.replace(chave_id, texto_seguro)
        
    return html_final


if __name__ == "__main__":
    # Cores no console para feedback visual
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO (PREENCHA AQUI O QUE DESEJA TRADUZIR) 🟢
    # =========================================================================
    
    ARQUIVO_BASE_PORTUGUES = "menu-global.html" # O arquivo raiz que servirá de molde
    
    # Preencha a lista com a sigla da pasta de idiomas que deseja gerar (ex: 'de', 'es', 'zh')
    IDIOMAS_ALVO = ["zh"] 
    
    # =========================================================================

    if not os.path.exists(ARQUIVO_BASE_PORTUGUES):
        print(f"{C_AMARELO}❌ ERRO: O arquivo '{ARQUIVO_BASE_PORTUGUES}' não foi encontrado no diretório atual.{RESET}")
        exit()

    print(f"\n{C_AZUL}Iniciando a máquina de tradução cirúrgica do Menu Global...{RESET}")

    # Lê o HTML base em português UMA VEZ
    with open(ARQUIVO_BASE_PORTUGUES, 'r', encoding='utf-8') as f:
        html_original = f.read()

    for idx, idioma in enumerate(IDIOMAS_ALVO):
        print(f"\n{C_AMARELO}======================================================={RESET}")
        print(f"{C_AZUL}▶ TRADUZINDO PARA:   {C_AMARELO}{idioma.upper()} {C_VERDE}(Destino: ./{idioma}/menu-global.html){RESET}")
        print(f"{C_AMARELO}======================================================={RESET}")
        
        # PASSO 1: Isola os textos para não corromper o código
        html_com_placeholders, dict_originais = extrair_textos_do_html(html_original)
        
        # PASSO 2: Ajusta os caminhos href para refletir a pasta do idioma atual
        html_rotas_ajustadas = ajustar_caminhos_do_menu(html_com_placeholders, idioma)
        
        # PASSO 3: Realiza a tradução utilizando IA (DeepSeek)
        dict_traduzido = traduzir_com_deepseek(dict_originais, idioma)
        
        if dict_traduzido:
            # PASSO 4: Reconstrói o HTML com as palavras traduzidas
            html_final = restaurar_html(html_rotas_ajustadas, dict_traduzido)
            
            # PASSO 5: Salva no destino correto dentro da pasta correspondente
            pasta_destino = f"./{idioma}/"
            os.makedirs(pasta_destino, exist_ok=True)
            caminho_salvamento = os.path.join(pasta_destino, ARQUIVO_BASE_PORTUGUES)
            
            with open(caminho_salvamento, 'w', encoding='utf-8') as f:
                f.write(html_final)
                
            print(f"{C_VERDE}✅ SUCESSO! Menu '{idioma.upper()}' estruturado e salvo em: {caminho_salvamento}{RESET}")
            
            # === PAUSA DE SEGURANÇA (RATE LIMIT DEEPSEEK) ===
            # Aguarda o intervalo de segurança caso não seja o último idioma da fila
            if idx < len(IDIOMAS_ALVO) - 1:
                print(f"{C_AMARELO}⏳ Pausa de segurança: Aguardando 45 segundos para evitar bloqueios da API...{RESET}")
                time.sleep(45)
        else:
             print(f"{C_AMARELO}⚠️ A tradução para '{idioma}' falhou ou retornou vazia. Verifique sua chave API.{RESET}")

    print(f"\n{C_VERDE}🎉 TODAS AS TRADUÇÕES DO MENU GLOBAL FORAM CONCLUÍDAS COM SUCESSO!{RESET}\n")