import os
import subprocess
import time
from datetime import datetime
from dotenv import load_dotenv  # noqa
from openai import OpenAI

# Carrega .env
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY")

if not OPENAI_KEY and not DEEPSEEK_KEY:
    raise ValueError("Nenhuma API key encontrada. Configure OPENAI_API_KEY ou DEEPSEEK_API_KEY no .env")

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

def traduzir_html_com_api(html_preparado, idioma_alvo):
    """Traduz com retry automático: alterna OpenAI/DeepSeek, espera 25s entre rounds, até 10 tentativas."""
    import httpx

    gnomes_idiomas = {
        "en": "English", "es": "Spanish", "de": "German", "it": "Italian",
        "fr": "French", "hi": "Hindi", "zh": "Chinese", "ar": "Arabic",
        "ja": "Japanese", "ru": "Russian", "ko": "Korean", "tr": "Turkish",
        "nl": "Dutch", "pl": "Polish", "sv": "Swedish", "id": "Indonesian",
        "vi": "Vietnamese", "uk": "Ukrainian",
    }
    nome = gnomes_idiomas.get(idioma_alvo, idioma_alvo)
    tamanho = len(html_preparado)

    instrucoes = f"""You are an expert in web development, international SEO, and clinical medical translation.
Translate the HTML code from Portuguese to {nome} (ISO '{idioma_alvo}').

MANDATORY RULES:
1. NEVER translate literally. Adapt to local culture, daily language, and nursing jargon.
2. Adapt weights, measures, and clinical protocols to the target country.
3. SEO tags (title, meta description, h1, h2, schema.org) must use high-search-volume local terms.
4. Replace Portuguese bibliography references with recognized English scientific sources.
5. Return the COMPLETE HTML code. Do NOT omit parts, abbreviate functions, or change structure.
6. Reorder hreflang tags so '{idioma_alvo}' comes first after pt-br.
7. Return ONLY raw HTML, no markdown, no explanations."""

    apis = [
        (OPENAI_KEY, "https://api.openai.com/v1", "gpt-4o-mini", "OpenAI"),
        (DEEPSEEK_KEY, "https://api.deepseek.com/v1", "deepseek-chat", "DeepSeek"),
    ]

    MAX_TENTATIVAS = 10
    tentativa = 0

    while tentativa < MAX_TENTATIVAS:
        for key, base_url, modelo, nome_api in apis:
            if not key:
                continue
            tentativa += 1
            try:
                print(f"      [{tentativa}/{MAX_TENTATIVAS}] 🤖 {nome_api}: {tamanho} chars...", end=" ", flush=True)
                client = OpenAI(api_key=key, base_url=base_url, timeout=httpx.Timeout(180.0, connect=30.0))
                resposta = client.chat.completions.create(
                    model=modelo,
                    messages=[
                        {"role": "system", "content": instrucoes},
                        {"role": "user", "content": html_preparado},
                    ],
                    temperature=0.2,
                )
                tokens = resposta.usage.total_tokens if resposta.usage else 0
                print(f"✓ ({tokens} tokens)")
                return resposta.choices[0].message.content.strip()
            except Exception as e:
                erro = str(e)[:100]
                print(f"✗ {erro}")
                if tentativa >= MAX_TENTATIVAS:
                    break

        # Se chegou aqui, ambas falharam neste round — espera 25s e tenta de novo
        if tentativa < MAX_TENTATIVAS:
            print(f"      ⏳ Aguardando 25s antes do próximo round...")
            time.sleep(25)

    print(f"      ❌ Esgotadas {MAX_TENTATIVAS} tentativas")
    return None

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
    
    # Adicione os arquivos que deseja traduzir na lista abaixo, separados por vírgula.
    arquivos_originais = ["fast.html"] 
    
    # Adicione os idiomas alvo na lista abaixo, separados por vírgula.
    idiomas_alvo = ["es"]
    
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
                
                print(f"{C_AZUL}[2/4]{RESET} Enviando para API (OpenAI / DeepSeek)...")
                html_traduzido = traduzir_html_com_api(html_preparado, idioma_alvo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[3/4]{RESET} Salvando arquivo (sobrescrevendo se existir)...")
                    pasta_destino = f"./{idioma_alvo}/"
                    os.makedirs(pasta_destino, exist_ok=True)
                    
                    nome_arquivo = os.path.basename(arquivo_original)
                    caminho_saida = os.path.join(pasta_destino, nome_arquivo)
                    
                    # O modo 'w' garante que o arquivo antigo seja substituído
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_traduzido)
                        
                    print(f"{C_VERDE}✅ SUCESSO! Arquivo salvo em: {caminho_saida}{RESET}\n")

                    # Execução de comandos do Node e Tailwind na raiz do projeto
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
                    
                    # Gera e salva o log na raiz
                    try:
                        with open("log_traducoes.txt", "a", encoding="utf-8") as log_file:
                            data_atual = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                            log_file.write(f"[{data_atual}] HTML traduzido: '{arquivo_original}' | Idioma alvo: '{idioma_alvo}' | Destino: '{caminho_saida}'\n")
                        print(f"{C_VERDE}📝 Log gerado/atualizado com sucesso em log_traducoes.txt.{RESET}")
                    except Exception as e:
                        print(f"{C_AMARELO}⚠️ Aviso: Erro ao escrever o log: {e}{RESET}")

                    print(f"\n{C_VERDE}🚀 CICLO COMPLETO FINALIZADO PARA '{arquivo_original}' EM '{idioma_alvo}'!{RESET}")
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")