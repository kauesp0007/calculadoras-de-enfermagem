import os
import subprocess
import re
from dotenv import load_dotenv
from openai import OpenAI

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPSEEK_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPSEEK_API_KEY.")

# Configuração de Cores para o Terminal
C_AMARELO = '\033[93m'
C_VERDE   = '\033[92m'
C_AZUL    = '\033[96m'
C_ROXO    = '\033[95m'
RESET     = '\033[0m'

# =========================================================
# BLOCO CSS DO FEATURED GRID (para inserção automática)
# =========================================================
CSS_FEATURED_GRID = """
/* ===== Estilos da Grade de Acessos Rápidos (Destaques) ===== */
      .featured-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(1, minmax(0, 1fr));
        margin-top: 1rem;
      }

      @media (min-width: 640px) {
        .featured-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (min-width: 1024px) {
        .featured-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      .featured-item {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        width: 100%;
        height: 100%;
      }

      .featured-img-wrapper {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(10, 35, 77, 0.15);
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
        background-color: #f3f6fa;
        aspect-ratio: 16 / 9;
        display: block;
      }

      .featured-img-wrapper:hover {
        transform: scale(1.04);
        box-shadow: 0 18px 35px rgba(10, 35, 77, 0.25);
      }

      .featured-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .featured-btn {
        width: 100%;
        background-color: rgba(30, 58, 138, 0.85);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 14px 16px;
        border-radius: 50px;
        font-weight: bold;
        font-size: 0.9rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-decoration: none;
        line-height: 1.3;
        min-height: 64px;
      }

      .featured-btn:hover {
        background-color: rgba(30, 58, 138, 1);
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
        color: white;
        text-decoration: none;
      }
"""

def inserir_css_featured_grid(html):
    """
    Verifica se o CSS do .featured-grid já está presente no HTML.
    Se não estiver, insere o bloco CSS dentro de uma tag <style> no <head>.
    Retorna o HTML corrigido.
    """
    if re.search(r'\.featured-grid\s*{', html, re.IGNORECASE):
        return html

    match_head = re.search(r'<head>(.*?)</head>', html, re.IGNORECASE | re.DOTALL)
    if not match_head:
        return html

    novo_html = html.replace('</head>', f'<style>\n{CSS_FEATURED_GRID}\n</style>\n</head>', 1)
    return novo_html

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

    # ==========================================
    # 3. PADRONIZAÇÃO DO LOCALE NA TAG HTML (SEO)
    # ==========================================
    mapa_locales = {
        "pt": "pt-BR",
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
        "it": "it-IT",
        "de": "de-DE",
        "hi": "hi-IN",
        "zh": "zh-CN",
        "ja": "ja-JP",
        "ru": "ru-RU",
        "ko": "ko-KR",
        "tr": "tr-TR",
        "nl": "nl-NL",
        "pl": "pl-PL",
        "sv": "sv-SE",
        "id": "id-ID",
        "vi": "vi-VN",
        "uk": "uk-UA",
        "ar": "ar-SA"
    }
    
    locale_correto = mapa_locales.get(idioma_alvo, idioma_alvo)
    html = re.sub(r'(<html[^>]*?lang=")[^"]*(")', rf'\g<1>{locale_correto}\g<2>', html, flags=re.IGNORECASE)

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
        
    match_head = re.search(r'<head>(.*?)</head>', html, re.IGNORECASE | re.DOTALL)
    if match_head:
        return f"\n\nATENÇÃO - DADOS DA PÁGINA ANTERIOR ENCONTRADOS: MANTENHA OBRIGATORIAMENTE o SEO (Title, Meta Description, Keywords, Schema.org) e as unidades de medidas (peso, temp, volume) que estão presentes neste bloco, corrigindo apenas se a descrição/título excederem os caracteres limite do Google para indexação:\n\n<head>{match_head.group(1)}</head>"
    return ""

def traduzir_html_com_deepseek(html_preparado, idioma_alvo, contexto_seo):
    instrucoes_sistema = f"""
    Você é um especialista em desenvolvimento web, SEO internacional e tradução médica clínica avançada.
    Sua tarefa é traduzir o código HTML fornecido do português para o idioma correspondente ao código ISO '{idioma_alvo}'.

    REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:

    1. A tradução NUNCA deve ser literal. Adapte para as expressões culturais e jargão da enfermagem local. NÃO traduza nomes científicos.

    2. Adapte OBRIGATORIAMENTE pesos, medidas, volume e temperatura para a realidade do país alvo, SALVO se o contexto da página antiga (fornecido abaixo) já os tiver definido.

    3. LINKS: MANTENHA os links (href) para outras páginas do site exatamente como estão no original (como caminhos relativos). NUNCA adicione a pasta do idioma na frente do link. Exemplo: href="gasometria.html" DEVE CONTINUAR href="gasometria.html". Como o arquivo já será armazenado na pasta certa, o navegador do usuário fará o direcionamento local automaticamente.

    4. PRESERVAÇÃO TOTAL DO CÓDIGO: Você NUNCA deve remover, simplificar, omitir ou "otimizar" nenhuma parte do código HTML, mesmo que pareça redundante ou não relacionada à tradução. Isso inclui, mas não se limita a:
        - Todas as tags <style> e seu conteúdo CSS.
        - Todos os <script> (exceto os textos que devem ser traduzidos, mas mantenha a estrutura).
        - Comentários, atributos HTML, classes, IDs, e qualquer outro elemento de código.
        - A estrutura hierárquica do documento deve ser preservada integralmente.
        - Se o código contém estilos para .featured-grid, .featured-item, etc., eles DEVEM permanecer exatamente como estão.

    5. PRESERVAÇÃO DE SEO E SCHEMA: Preserve rigorosamente todas as tags HTML, Schema.org e SEO. Se o bloco 'DADOS DA PÁGINA ANTERIOR' estiver presente no final deste prompt, REUTILIZE E MANTENHA os títulos, descrições e schema da página antiga para manter a indexação perfeita. Ajuste apenas se os caracteres excederem o limite recomendado pela Google.

    6. HREFLANG: Analise a lista de <link rel="alternate" hreflang="...">. Respeite APENAS os idiomas que já estão declarados (não crie idiomas novos deliberadamente). Reordene para que o idioma alvo ('{idioma_alvo}') seja o primeiro. A tag 'x-default' deve apontar para a raiz do repositório.

    7. CORE WEB VITALS: Respeite as boas práticas de responsividade, mobile e acessibilidade ao longo de toda a tradução, corrigindo inconsistências caso note.

    8. Referências bibliográficas originais em português devem ser substituídas por fontes científicas seguras em inglês.

    9. Entregue o código COMPLETO, sem omitir e sem abreviar. NUNCA use reticências ou "..." para indicar que algo foi pulado. O código deve ser reproduzido na íntegra.

    10. Retorne estritamente o código HTML puro, sem marcadores markdown (como ```html).

    {contexto_seo}
    """

    try:
        client = OpenAI(
            api_key=CHAVE_API,
            base_url="https://api.deepseek.com"
        )
        
        mensagens = [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": html_preparado}
        ]
        
        resultado_completo = ""
        parte_num = 1
        
        while True:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=mensagens,
                temperature=0.2,
                max_tokens=8192,
                stream=False
            )
            
            texto_gerado = response.choices[0].message.content
            resultado_completo += texto_gerado
            
            motivo_parada = response.choices[0].finish_reason
            
            if motivo_parada == "length":
                print(f"      {C_AMARELO}↳ Arquivo longo (Parte {parte_num} atingiu o limite de tokens). Solicitando continuação automática...{RESET}")
                mensagens.append({"role": "assistant", "content": texto_gerado})
                mensagens.append({"role": "user", "content": "Continue gerando o código HTML exatamente de onde você parou no último caractere. Não adicione nenhuma saudação inicial, não escreva 'Aqui está a continuação', e não use os marcadores ```html novos, apenas jogue o código bruto continuando o anterior."})
                parte_num += 1
            else:
                break
                
        resultado = resultado_completo.strip()
        
        # Limpeza caso o modelo retorne com marcadores markdown
        if resultado.startswith("```html"):
            resultado = resultado[7:]
        if resultado.startswith("```"):
            resultado = resultado[3:]
        if resultado.endswith("```"):
            resultado = resultado[:-3]
            
        return resultado.strip()
        
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API DeepSeek: {e}")
        return None

def rodar_build():
    """
    Executa os comandos de build necessários: Tailwind, Service Worker e Cache Buster.
    Retorna True se todos foram bem-sucedidos, False caso contrário.
    """
    comandos_build = [
        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        "node gerar-sw.js",
        "node aplicar-cache-buster.js"
    ]
    sucesso = True
    for comando in comandos_build:
        print(f"{C_AZUL}⚙️ Executando:{RESET} {comando}")
        try:
            subprocess.run(comando, shell=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"\n{C_AMARELO}⚠️ Aviso: O comando falhou: {comando}{RESET}")
            sucesso = False
    return sucesso

if __name__ == "__main__":
    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # =========================================================================
    
    arquivos_originais = ["index.html"] 
    idiomas_alvo       = ["es"]         
    
    # =========================================================================

    arquivos_processados_com_sucesso = 0

    for arquivo in arquivos_originais:
        for idioma in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma} {C_VERDE}(Será salvo na pasta: ./{idioma}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if not os.path.exists(arquivo):
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo}' não foi encontrado na raiz.{RESET}")
                continue

            print(f"{C_AZUL}[1/6]{RESET} Preparando rotas e estrutura do HTML...")
            html_preparado = preparar_html_para_traducao_texto(arquivo, idioma)
            
            pasta_destino = f"./{idioma}/"
            caminho_saida = os.path.join(pasta_destino, os.path.basename(arquivo))
            
            print(f"{C_AZUL}[2/6]{RESET} Escaneando SEO da página de destino existente (se houver)...")
            contexto_seo = extrair_seo_existente(caminho_saida)
            if contexto_seo:
                print(f"      {C_VERDE}↳ Dados de SEO antigos encontrados e injetados na memória.{RESET}")
            else:
                print(f"      {C_AMARELO}↳ Nenhuma versão antiga encontrada. Tradução 100% nova.{RESET}")

            print(f"{C_AZUL}[3/6]{RESET} Enviando para o motor semântico DeepSeek...")
            html_traduzido = traduzir_html_com_deepseek(html_preparado, idioma, contexto_seo)
            
            if not html_traduzido:
                print(f"{C_AMARELO}❌ Falha na tradução. Pulando este idioma.{RESET}")
                continue

            # =========================================================
            # CORREÇÃO AUTOMÁTICA DO CSS (se necessário)
            # =========================================================
            print(f"{C_AZUL}[4/6]{RESET} Verificando e corrigindo CSS do featured-grid...")
            html_corrigido = inserir_css_featured_grid(html_traduzido)
            if html_corrigido != html_traduzido:
                print(f"      {C_VERDE}↳ CSS do featured-grid inserido (estava ausente).{RESET}")
            else:
                print(f"      {C_VERDE}↳ CSS já presente. Nenhuma alteração necessária.{RESET}")

            print(f"{C_AZUL}[5/6]{RESET} Salvando arquivo (sobrescrevendo)...")
            os.makedirs(pasta_destino, exist_ok=True)
            
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                f.write(html_corrigido)
                
            print(f"{C_VERDE}✅ SUCESSO! Arquivo atualizado em: {caminho_saida}{RESET}")
            arquivos_processados_com_sucesso += 1

            # =========================================================
            # EXECUTA OS COMANDOS DE BUILD APÓS CADA TRADUÇÃO
            # =========================================================
            print(f"{C_AZUL}[6/6]{RESET} Executando build e cache buster para este idioma...")
            if rodar_build():
                print(f"{C_VERDE}✅ Build concluído com sucesso!{RESET}")
            else:
                print(f"{C_AMARELO}⚠️ Build com falhas, mas o arquivo foi salvo.{RESET}")

    if arquivos_processados_com_sucesso == 0:
        print(f"\n{C_AMARELO}Nenhum arquivo foi processado. Verifique a lista de arquivos e pastas.{RESET}")
    else:
        print(f"\n{C_VERDE}🚀 PROCESSO CONCLUÍDO! {arquivos_processados_com_sucesso} arquivo(s) traduzido(s) e corrigido(s).{RESET}")