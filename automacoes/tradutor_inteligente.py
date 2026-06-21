import os
import subprocess
import re
from dotenv import load_dotenv
from openai import OpenAI

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPSEEK_API_KEY") # Ajuste aqui se o nome no seu .env for diferente
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPSEEK_API_KEY.")

# Configuração de Cores para o Terminal (Movido para cima para uso global)
C_AMARELO = '\033[93m'
C_VERDE   = '\033[92m'
C_AZUL    = '\033[96m'
C_ROXO    = '\033[95m'
RESET     = '\033[0m'

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
    4. PRESERVAÇÃO DE SEO E SCHEMA: Preserve rigorosamente todas as tags HTML, Schema.org e SEO. Se o bloco 'DADOS DA PÁGINA ANTERIOR' estiver presente no final deste prompt, REUTILIZE E MANTENHA os títulos, descrições e schema da página antiga para manter a indexação perfeita. Ajuste apenas se os caracteres excederem o limite recomendado pela Google.
    5. HREFLANG: Analise a lista de <link rel="alternate" hreflang="...">. Respeite APENAS os idiomas que já estão declarados (não crie idiomas novos deliberadamente). Reordene para que o idioma alvo ('{idioma_alvo}') seja o primeiro. A tag 'x-default' deve apontar para a raiz do repositório.
    6. CORE WEB VITALS: Respeite as boas práticas de responsividade, mobile e acessibilidade ao longo de toda a tradução, corrigindo inconsistências caso note.
    7. Referências bibliográficas originais em português devem ser substituídas por fontes científicas seguras em inglês.
    8. Entregue o código COMPLETO, sem omitir e sem abreviar.
    9. Retorne estritamente o código HTML puro, sem marcadores markdown (como ```html).
    
    {contexto_seo}
    """

    try:
        client = OpenAI(
            api_key=CHAVE_API,
            base_url="https://api.deepseek.com" # URL LIMPA E CORRIGIDA
        )
        
        mensagens = [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": html_preparado}
        ]
        
        resultado_completo = ""
        parte_num = 1
        
        # LOOP DE PAGINAÇÃO: Se o modelo cortar por limite, pedimos para continuar
        while True:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=mensagens,
                temperature=0.2,
                max_tokens=8192, # Forçamos o limite máximo para diminuir quebras
                stream=False
            )
            
            texto_gerado = response.choices[0].message.content
            resultado_completo += texto_gerado
            
            # Verifica o motivo do modelo ter parado
            motivo_parada = response.choices[0].finish_reason
            
            if motivo_parada == "length":
                print(f"      {C_AMARELO}↳ Arquivo longo (Parte {parte_num} atingiu o limite de tokens). Solicitando continuação automática...{RESET}")
                # Adicionamos a resposta dele no histórico para ele saber onde parou
                mensagens.append({"role": "assistant", "content": texto_gerado})
                # Pedimos para continuar estritamente do ponto de corte
                mensagens.append({"role": "user", "content": "Continue gerando o código HTML exatamente de onde você parou no último caractere. Não adicione nenhuma saudação inicial, não escreva 'Aqui está a continuação', e não use os marcadores ```html novos, apenas jogue o código bruto continuando o anterior."})
                parte_num += 1
            else:
                # O modelo terminou naturalmente (finish_reason == "stop")
                break
                
        resultado = resultado_completo.strip()
        
        # Limpeza caso o modelo retorne com marcadores markdown no início ou final do arquivo completo
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

if __name__ == "__main__":
    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # =========================================================================
    
    arquivos_originais = ["index.html"] 
    idiomas_alvo       = ["es", "de", "fr", "hi", "it", "zh", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"]         
    
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
                
                pasta_destino = f"./{idioma}/"
                caminho_saida = os.path.join(pasta_destino, os.path.basename(arquivo))
                
                print(f"{C_AZUL}[2/5]{RESET} Escaneando SEO da página de destino existente (se houver)...")
                contexto_seo = extrair_seo_existente(caminho_saida)
                if contexto_seo:
                    print(f"      {C_VERDE}↳ Dados de SEO antigos encontrados e injetados na memória.{RESET}")
                else:
                    print(f"      {C_AMARELO}↳ Nenhuma versão antiga encontrada. Tradução 100% nova.{RESET}")

                print(f"{C_AZUL}[3/5]{RESET} Enviando para o motor semântico DeepSeek...")
                html_traduzido = traduzir_html_com_deepseek(html_preparado, idioma, contexto_seo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[4/5]{RESET} Salvando arquivo (sobrescrevendo)...")
                    os.makedirs(pasta_destino, exist_ok=True)
                    
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_traduzido)
                        
                    print(f"{C_VERDE}✅ SUCESSO! Arquivo atualizado em: {caminho_saida}{RESET}")
                    arquivos_processados_com_sucesso += 1
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo}' não foi encontrado na raiz.{RESET}")

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