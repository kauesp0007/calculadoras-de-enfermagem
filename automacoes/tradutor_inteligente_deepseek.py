import os
import subprocess
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPSEEK_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPSEEK_API_KEY.")

def preparar_html_para_traducao_texto(caminho_arquivo, idioma_alvo):
    """
    Trata o HTML puramente como texto, garantindo que NADA na estrutura, 
    indentação ou tags originais seja alterado por analisadores de DOM.
    """
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html = f.read()

    # ==========================================
    # 1. SUBSTITUIÇÃO CIRÚRGICA DO FOOTER
    # ==========================================
    footer_novo = """<div id="footer-placeholder"></div>
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

    marcador_inicio = '<div id="footer-placeholder"></div>'
    marcador_fim = '</script>'
    
    idx_inicio = html.rfind(marcador_inicio)
    
    if idx_inicio != -1:
        idx_fim = html.find(marcador_fim, idx_inicio)
        if idx_fim != -1:
            idx_fim += len(marcador_fim) 
            bloco_antigo = html[idx_inicio:idx_fim]
            html = html.replace(bloco_antigo, footer_novo)

    # ==========================================
    # 2. REGRAS RÍGIDAS DE ROTEAMENTO MODULAR
    # ==========================================
    regras_rotas = {
        # --- Forçar Absolutos (iniciando com /) ---
        'href="global-styles.css"': 'href="/global-styles.css"',
        'href="./global-styles.css"': 'href="/global-styles.css"',
        'src="lang-selector.js"': 'src="/lang-selector.js"',
        'src="./lang-selector.js"': 'src="/lang-selector.js"',
        'href="_language_selector.html"': 'href="/_language_selector.html"',
        'href="./_language_selector.html"': 'href="/_language_selector.html"',
        'href="manifest.json"': 'href="/manifest.json"',
        'src="ce-calculadora-padrao.js"': 'src="/ce-calculadora-padrao.js"',
        
        # --- Forçar Relativos (pasta local, sem /) ---
        'src="/global-scripts.js"': 'src="global-scripts.js"',
        'src="./global-scripts.js"': 'src="global-scripts.js"',
        'href="/global-body-elements.html"': 'href="global-body-elements.html"',
        'href="./global-body-elements.html"': 'href="global-body-elements.html"',
        'href="/menu-global.html"': 'href="menu-global.html"',
        'href="./menu-global.html"': 'href="menu-global.html"',
        
        # --- Imagens para Absoluto ---
        'src="img/': 'src="/img/',
        'src="../img/': 'src="/img/'
    }

    for antigo, novo in regras_rotas.items():
        html = html.replace(antigo, novo)

    return html

def dividir_html_em_blocos(html, max_chars=12000):
    """Divide o HTML em blocos respeitando quebras de linha, sem cortar tags."""
    linhas = html.splitlines(keepends=True)  # mantém as quebras
    blocos = []
    bloco_atual = ""
    for linha in linhas:
        if len(bloco_atual) + len(linha) <= max_chars:
            bloco_atual += linha
        else:
            if bloco_atual:
                blocos.append(bloco_atual)
            bloco_atual = linha
    if bloco_atual:
        blocos.append(bloco_atual)
    return blocos

def traduzir_bloco(bloco, idioma_alvo, contexto_anterior=""):
    """Traduz um único bloco de HTML, com contexto opcional."""
    instrucoes_sistema = f"""
    Você é um especialista em desenvolvimento web, SEO internacional e tradução médica clínica avançada.
    Sua tarefa é traduzir o código HTML fornecido do português para o idioma correspondente ao código ISO '{idioma_alvo}'.
    
    REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
    1. A tradução NUNCA deve ser literal. Adapte para as expressões culturais, a forma de escrita do dia a dia e o jargão da enfermagem local.
    2. Adapte OBRIGATORIAMENTE pesos, medidas e protocolos clínicos para a realidade do país alvo.
    3. As tags estruturais de SEO (title, meta description, h1, h2, schema.org) devem ser cuidadosamente localizadas utilizando os termos de maior volume de busca na região para maximizar o engajamento orgânico, cliques e receita de AdSense.
    4. Qualquer referência bibliográfica original em português presente no texto deve ser substituída por fontes científicas seguras, reconhecidas e publicadas em inglês.
    5. O código traduzido deve ser entregue de forma COMPLETA e INTEGRAL. Não omita partes, não abrevie funções e não tente melhorar ou alterar a estrutura original não solicitada.
    6. Reordene a lista de tags <link rel="alternate" hreflang="..."> dentro do <head> para que a tag correspondente ao idioma alvo ('{idioma_alvo}') seja a primeira da lista.
    7. Retorne estritamente o código HTML puro, sem marcadores markdown (como ```html) e sem nenhum texto ou explicação adicional antes ou depois do código.
    
    REGRA ADICIONAL EXTREMAMENTE IMPORTANTE (8):
    Você DEVE traduzir o conteúdo textual de TODAS as linhas deste bloco, sem omitir, resumir ou modificar a estrutura. Cada linha deve ser preservada exatamente como está, apenas substituindo os textos em português pelos equivalentes no idioma alvo. NENHUMA linha pode ser removida ou encurtada.
    """

    # Monta o prompt do usuário com contexto
    prompt_usuario = f"Traduza o HTML completo deste bloco, linha por linha, sem omitir nada.\n"
    if contexto_anterior:
        prompt_usuario += f"Contexto do bloco anterior (para consistência): {contexto_anterior}\n\n"
    prompt_usuario += bloco

    try:
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {CHAVE_API}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": instrucoes_sistema},
                {"role": "user", "content": prompt_usuario}
            ],
            "temperature": 0.2
        }
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API (bloco): {e}")
        return None

def traduzir_html_com_deepseek(html_preparado, idioma_alvo):
    """Traduz o HTML completo, dividindo em blocos se necessário."""
    blocos = dividir_html_em_blocos(html_preparado)
    print(f"   (HTML dividido em {len(blocos)} bloco(s) para tradução)")

    partes_traduzidas = []
    contexto = ""

    for i, bloco in enumerate(blocos):
        print(f"   Traduzindo bloco {i+1}/{len(blocos)}...")
        # Pega as primeiras 200 palavras do bloco como contexto para o próximo
        palavras = bloco[:500].split()[:200]
        resumo_contexto = " ".join(palavras)

        bloco_traduzido = traduzir_bloco(bloco, idioma_alvo, contexto)
        if bloco_traduzido is None:
            return None
        partes_traduzidas.append(bloco_traduzido)
        # Atualiza o contexto com o resumo do bloco atual (já traduzido? não, usamos o original para consistência)
        contexto = resumo_contexto  # ou poderia ser o início do bloco traduzido, mas mantemos simples

    # Concatena todos os blocos traduzidos
    html_completo = "\n".join(partes_traduzidas)
    return html_completo

if __name__ == "__main__":
    # Cores para o terminal do VS Code
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # =========================================================================
    
    arquivos_originais = ["index.html"] 
    idiomas_alvo = ["zh"]  # Exemplo: francês, italiano, alemão, espanhol
    
    # =========================================================================

    for arquivo_original in arquivos_originais:
        for idioma_alvo in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo_original}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma_alvo} {C_VERDE}(Será salvo na pasta: ./{idioma_alvo}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if os.path.exists(arquivo_original):
                print(f"{C_AZUL}[1/4]{RESET} Preparando rotas e estrutura do HTML...")
                html_preparado = preparar_html_para_traducao_texto(arquivo_original, idioma_alvo)
                
                print(f"{C_AZUL}[2/4]{RESET} Enviando para o motor semântico DeepSeek (com chunking automático)...")
                html_traduzido = traduzir_html_com_deepseek(html_preparado, idioma_alvo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[3/4]{RESET} Salvando arquivo (sobrescrevendo se existir)...")
                    pasta_destino = f"./{idioma_alvo}/"
                    os.makedirs(pasta_destino, exist_ok=True)
                    
                    nome_arquivo = os.path.basename(arquivo_original)
                    caminho_saida = os.path.join(pasta_destino, nome_arquivo)
                    
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_traduzido)
                        
                    print(f"{C_VERDE}✅ SUCESSO! Arquivo salvo em: {caminho_saida}{RESET}\n")

                    print(f"{C_AMARELO}======================================================={RESET}")
                    print(f"{C_ROXO}▶ INICIANDO PROCESSO DE BUILD E CACHE AUTOMÁTICO{RESET}")
                    print(f"{C_AMARELO}======================================================={RESET}\n")

                    comandos_build = [
                        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
                        "node gerar-sw.js",
                    ]

                    for comando in comandos_build:
                        print(f"{C_AZUL}⚙️ Executando:{RESET} {comando}")
                        try:
                            subprocess.run(comando, shell=True, check=True)
                        except subprocess.CalledProcessError as e:
                            print(f"\n{C_AMARELO}⚠️ Aviso: O comando falhou: {comando}{RESET}")
                    
                    try:
                        with open("log_traducoes.txt", "a", encoding="utf-8") as log_file:
                            data_atual = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                            log_file.write(f"[{data_atual}] HTML traduzido: '{arquivo_original}' | Idioma: '{idioma_alvo}' | Destino: '{caminho_saida}'\n")
                        print(f"{C_VERDE}📝 Log gerado/atualizado com sucesso em log_traducoes.txt.{RESET}")
                    except Exception as e:
                        print(f"{C_AMARELO}⚠️ Aviso: Erro ao escrever o log: {e}{RESET}")

                    print(f"\n{C_VERDE}🚀 CICLO COMPLETO FINALIZADO PARA '{arquivo_original}' EM '{idioma_alvo}'!{RESET}")
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")