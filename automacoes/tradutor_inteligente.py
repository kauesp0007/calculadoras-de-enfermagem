import os
import subprocess
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("GEMINI_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a GEMINI_API_KEY.")

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
        'href="global-styles.html"': 'href="/global-styles.html"',
        'href="./global-styles.html"': 'href="/global-styles.html"',
        'src="lang-selector.js"': 'src="/lang-selector.js"',
        'src="./lang-selector.js"': 'src="/lang-selector.js"',
        
        # --- Imagens para Absoluto (Exceções definidas) ---
        'href="favicon.ico"': 'href="/favicon.ico"',
        'href="./favicon.ico"': 'href="/favicon.ico"',
        'src="iconpages-calculadoras-de-enfermagem.webp"': 'src="/iconpages-calculadoras-de-enfermagem.webp"',
        'src="img/calculadora-de-gasometria-arterial-calculadoras-de-enfermagem.webp"': 'src="/img/calculadora-de-gasometria-arterial-calculadoras-de-enfermagem.webp"',
        'src="img/dimensionamento-da-equipe-de-enfermagem-calculadoras-de-enfermagem-1-calculadoras-de-enfermagem.webp"': 'src="/img/dimensionamento-da-equipe-de-enfermagem-calculadoras-de-enfermagem-1-calculadoras-de-enfermagem.webp"',
        'src="img/escala-de-braden-lesoes-por-pressao-calculadoras-de-enfermagem.webp"': 'src="/img/escala-de-braden-lesoes-por-pressao-calculadoras-de-enfermagem.webp"',
        'src="img/simulado-para-enfermeiros-calculadoras-de-enfermagem.webp"': 'src="/img/simulado-para-enfermeiros-calculadoras-de-enfermagem.webp"',

        # --- Forçar Relativos (pasta local do idioma, sem /) ---
        'src="/global-scripts.js"': 'src="global-scripts.js"',
        'src="./global-scripts.js"': 'src="global-scripts.js"',
        'href="/global-body-elements.html"': 'href="global-body-elements.html"',
        'href="./global-body-elements.html"': 'href="global-body-elements.html"',
        'href="/menu-global.html"': 'href="menu-global.html"',
        'href="./menu-global.html"': 'href="menu-global.html"',
        'src="/filtro-index.js"': 'src="filtro-index.js"',
        'src="./filtro-index.js"': 'src="filtro-index.js"',
        
        # Demais caminhos de imagens em 'img/' são mantidos relativos de forma natural pelo HTML original 
        # para que busquem na pasta interna do respectivo idioma (ex: en/img/...)
    }

    for antigo, novo in regras_rotas.items():
        html = html.replace(antigo, novo)

    return html

def extrair_seo_existente(caminho_destino):
    """
    Lê o HTML antigo no idioma de destino (se existir) para extrair e proteger
    SEO, schema e unidades de conversão configuradas anteriormente.
    """
    if not os.path.exists(caminho_destino):
        return ""
        
    with open(caminho_destino, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Extrai a tag head inteira como contexto crítico
    match_head = re.search(r'<head>(.*?)</head>', html, re.IGNORECASE | re.DOTALL)
    if match_head:
        return f"\n\nATENÇÃO - DADOS DA PÁGINA ANTERIOR ENCONTRADOS: MANTENHA OBRIGATORIAMENTE o SEO (Title, Meta Description, Keywords, Schema.org) e as unidades de medidas (peso, temp, volume) que estão presentes neste bloco, corrigindo apenas se a descrição/título excederem os caracteres limite do Google para indexação:\n\n<head>{match_head.group(1)}</head>"
    return ""

def traduzir_html_com_gemini(html_preparado, idioma_alvo, contexto_seo):
    instrucoes_sistema = f"""
    Você é um especialista em desenvolvimento web, SEO internacional e tradução médica clínica avançada.
    Sua tarefa é traduzir o código HTML fornecido do português para o idioma correspondente ao código ISO '{idioma_alvo}'.
    
    REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
    1. A tradução NUNCA deve ser literal. Adapte para as expressões culturais e jargão da enfermagem local. NÃO traduza nomes científicos.
    2. Adapte OBRIGATORIAMENTE pesos, medidas, volume e temperatura para a realidade do país alvo, SALVO se o contexto da página antiga (fornecido abaixo) já os tiver definido.
    3. LINKS: MANTENHA os links (href) para outras páginas do site exatamente como estão no original (como caminhos relativos). NUNCA adicione a pasta do idioma na frente do link. Exemplo: href="gasometria.html" DEVE CONTINUAR href="gasometria.html". Como o arquivo já será armazenado na pasta certa, o navegador do usuário fará o direcionamento local automaticamente.
    4. PRESERVAÇÃO DE SEO E SCHEMA: Preserve rigorosamente todas as tags HTML, Schema.org e SEO. Se o bloco 'DADOS DA PÁGINA ANTERIOR' estiver presente no final deste prompt, REUTILIZE E MANTENHA os títulos, descrições e schema da página antiga para manter a indexação perfeita. Ajuste apenas se os caracteres excederem o limite recomendado pela Google.
    5. HREFLANG: Analise a lista de <link rel="alternate" hreflang="...">. Respeite APENAS os idiomas que já estão declarados (não crie idiomas novos deliberadamente). Reordene para que o idioma alvo ('{idioma_alvo}') seja o primeiro. A tag 'x-default' deve apontar para a raiz do repositório.
    6. CORE WEB VITALS: Respeite as boas práticas de responsividade, mobile e acessibilidade ao longo de toda a tradução, corrigindo inconsistências caso note.
    7. Referências bibliográficas originais em português devem ser substituídas por fontes científicas seguras em inglês.
    8. Entregue o código COMPLETO, sem omitir e sem abreviar.
    9. Retorne estritamente o código HTML puro, sem marcadores markdown (como ```html).
    
    {contexto_seo}
    """

    try:
        client = genai.Client(api_key=CHAVE_API)
        resposta = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=html_preparado,
            config=types.GenerateContentConfig(
                system_instruction=instrucoes_sistema,
                temperature=0.2
            )
        )
        return resposta.text.strip()
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API: {e}")
        return None

if __name__ == "__main__":
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # Agora aceita múltiplos ficheiros e idiomas (separados por vírgula em lista)
    # =========================================================================
    
    arquivos_originais = ["index.html"] # Ex: ["index.html", "imc.html", "glasgow.html"]
    idiomas_alvo       = ["en"]         # Ex: ["en", "es", "fr", "ja"]
    
    # =========================================================================

    arquivos_processados_com_sucesso = 0

    for arquivo in arquivos_originais:
        for idioma in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma} {C_VERDE}(Será salvo na pasta: ./{idioma}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if os.path.exists(arquivo):
                print(f"{C_AZUL}[1/5]{RESET} Preparando rotas e estrutura do HTML...")
                html_preparado = preparar_html_para_traducao_texto(arquivo, idioma)
                
                # Definir caminho e extrair SEO existente
                pasta_destino = f"./{idioma}/"
                caminho_saida = os.path.join(pasta_destino, os.path.basename(arquivo))
                
                print(f"{C_AZUL}[2/5]{RESET} Escaneando SEO da página de destino existente (se houver)...")
                contexto_seo = extrair_seo_existente(caminho_saida)
                if contexto_seo:
                    print(f"      {C_VERDE}↳ Dados de SEO antigos encontrados e injetados na memória.{RESET}")
                else:
                    print(f"      {C_AMARELO}↳ Nenhuma versão antiga encontrada. Tradução 100% nova.{RESET}")

                print(f"{C_AZUL}[3/5]{RESET} Enviando para o motor semântico Gemini...")
                html_traduzido = traduzir_html_com_gemini(html_preparado, idioma, contexto_seo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[4/5]{RESET} Salvando arquivo (sobrescrevendo)...")
                    os.makedirs(pasta_destino, exist_ok=True)
                    
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_traduzido)
                        
                    print(f"{C_VERDE}✅ SUCESSO! Arquivo atualizado em: {caminho_saida}{RESET}")
                    arquivos_processados_com_sucesso += 1
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo}' não foi encontrado na raiz.{RESET}")

    # Processo de build apenas se algum arquivo foi processado, e apenas 1 vez no final.
    if arquivos_processados_com_sucesso > 0:
        print(f"\n{C_AMARELO}======================================================={RESET}")
        print(f"{C_ROXO}▶ INICIANDO PROCESSO GERAL DE BUILD E CACHE AUTOMÁTICO{RESET}")
        print(f"{C_AMARELO}======================================================={RESET}\n")

        comandos_build = [
            r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
            "node gerar-sw.js",
            "node aplicar-cache-buster.js"
        ]

        for comando in comandos_build:
            print(f"{C_AZUL}⚙️ Executando:{RESET} {comando}")
            try:
                subprocess.run(comando, shell=True, check=True)
            except subprocess.CalledProcessError as e:
                print(f"\n{C_AMARELO}⚠️ Aviso: O comando falhou: {comando}{RESET}")
        
        print(f"\n{C_VERDE}🚀 CICLO DE LOTE COMPLETO FINALIZADO! ({arquivos_processados_com_sucesso} arquivos processados){RESET}")