# automacoes/tradutor_html.py

import os
import re
import sys
import time
import datetime
import subprocess
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from openai import OpenAI

# ============================================================
# 1. CONFIGURAÇÃO DA API
# ============================================================
load_dotenv()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not DEEPSEEK_API_KEY:
    print("❌ ERRO: DEEPSEEK_API_KEY não encontrada no arquivo .env")
    sys.exit(1)

# Inicializa o cliente compatível com OpenAI (DeepSeek)
client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com/v1"
)

# ============================================================
# 2. PARÂMETROS EDITÁVEIS PELO USUÁRIO
# ============================================================

# --- LISTA DE ARQUIVOS HTML PARA TRADUZIR ---
# Coloque aqui o(s) nome(s) do(s) arquivo(s) que deseja traduzir.
# Exemplo: ["balancohidrico.html", "outra-pagina.html"]
FILES_TO_TRANSLATE = [
    "balancohidrico.html",
    # "outro-arquivo.html",  # descomente e adicione mais
]

# --- LISTA DE IDIOMAS DESTINO ---
# Use os códigos ISO 639-1 (ex: "hi", "zh", "ar", "ja", "es", "en", "fr", "de"...)
# O script criará/sobrescreverá os arquivos nas pastas correspondentes.
TARGET_LANGUAGES = [
    "ru",   
    
]

# ============================================================
# 3. MAPEAMENTO DE IDIOMAS PARA CÓDIGOS DE REGIÃO
# ============================================================
LANG_REGION_MAP = {
    "hi": "hi-IN",
    "zh": "zh-CN",
    "ar": "ar-SA",
    "ja": "ja-JP",
    "pt": "pt-BR",
    "en": "en-US",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "it": "it-IT",
    "ru": "ru-RU",
    "ko": "ko-KR",
    "tr": "tr-TR",
    "nl": "nl-NL",
    "pl": "pl-PL",
    "sv": "sv-SE",
    "id": "id-ID",
    "vi": "vi-VN",
    "uk": "uk-UA",
}

# ============================================================
# 4. CONFIGURAÇÕES GLOBAIS
# ============================================================
ROOT_DIR = Path(__file__).parent.parent          # raiz do repositório
AUTOMACOES_DIR = ROOT_DIR / "automacoes"         # onde este script está
LOG_FILE = ROOT_DIR / "relatorio_de_traducao.txt"

# Comando de build (Tailwind + Service Worker)
BUILD_COMMAND = (
    '.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify ; node gerar-sw.js ;'
    'node gerar-sw.js'
)

# Limite de caracteres para enviar o HTML inteiro sem chunking
# DeepSeek tem 1M de contexto, mas definimos um limite seguro para ativar o fallback
CHAR_LIMIT_FOR_FULL = 150000

# ============================================================
# 5. FUNÇÕES AUXILIARES
# ============================================================

def log_translation(filename: str, lang: str, status: str = "SUCESSO", details: str = ""):
    """Registra cada tradução no arquivo de relatório (formato organizado)."""
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{now}] - Arquivo: {filename} | Idioma: {lang} | Status: {status}"
    if details:
        entry += f" | Detalhes: {details}"
    entry += "\n"

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry)

    print(f"📝 LOG: {entry.strip()}")


def run_build():
    """Executa os comandos de build (Tailwind + SW) após cada tradução."""
    print("⚙️  Executando build (Tailwind CSS e Service Worker)...")
    try:
        subprocess.run(
            BUILD_COMMAND,
            shell=True,
            cwd=ROOT_DIR,
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Build concluído com sucesso!")
    except subprocess.CalledProcessError as e:
        print(f"❌ ERRO durante o build: {e}")
        print(f"STDERR: {e.stderr}")
        raise


def split_html_into_chunks(html: str, max_chars: int = 100000) -> List[str]:
    """
    Divide o HTML em partes seguras (sem cortar tags) para tradução parcial.
    Retorna uma lista de chunks, cada um sendo um HTML parcialmente válido.
    """
    if len(html) <= max_chars:
        return [html]

    # Tenta separar <head> e <body>
    head_end = html.find('</head>')
    if head_end == -1:
        head = ''
        body = html
    else:
        head = html[:head_end + 7]  # inclui </head>
        body = html[head_end + 7:]

    chunks = []

    # Se o body for muito grande, divide em pedaços respeitando fechamento de tags
    if len(body) > max_chars:
        start = 0
        while start < len(body):
            end = min(start + max_chars, len(body))
            # Tenta quebrar em um '>' ou '\n' para não cortar tags no meio
            if end < len(body):
                end_candidate = body.rfind('>', start, end)
                if end_candidate != -1:
                    end = end_candidate + 1
                else:
                    end_candidate = body.rfind('\n', start, end)
                    if end_candidate != -1:
                        end = end_candidate + 1
                    else:
                        end = start + max_chars
            chunks.append(body[start:end])
            start = end
    else:
        chunks.append(body)

    # Monta os chunks com cabeçalho e rodapé para que o tradutor tenha contexto
    if len(chunks) == 1:
        return [head + chunks[0] + '</html>']
    else:
        first_chunk = head + chunks[0]
        last_chunk = chunks[-1] + '</html>'
        middle_chunks = chunks[1:-1]
        # Adiciona marcadores comentados para ajudar o modelo a entender a ordem
        result = [first_chunk]
        for i, chunk in enumerate(middle_chunks, start=2):
            result.append(
                f"<!-- INÍCIO DO CHUNK {i} DE {len(chunks)} -->\n{chunk}\n<!-- FIM DO CHUNK {i} -->"
            )
        result.append(last_chunk)
        return result


def translate_chunk(chunk: str, target_lang: str, lang_region: str, chunk_info: str = "") -> str:
    """
    Traduz um único chunk de HTML utilizando a API DeepSeek.
    """
    system_prompt = f"""
    Você é um tradutor profissional especializado em localização de sites de enfermagem e saúde.
    Você deve traduzir o código HTML a seguir do português brasileiro para o idioma: {target_lang} ({lang_region}).

    REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
    1. A tradução NUNCA deve ser literal. Adapte para as expressões culturais, a forma de escrita do dia a dia e o jargão da enfermagem local.
    2. Adapte OBRIGATORIAMENTE pesos, medidas e protocolos clínicos para a realidade do país alvo (ex: moeda no schema.org, referências bibliográficas).
    3. As tags estruturais de SEO (title, meta description, h1, h2, schema.org) devem ser cuidadosamente localizadas utilizando os termos de maior volume de busca na região para maximizar o engajamento orgânico, cliques e receita de AdSense.
    4. Qualquer referência bibliográfica original em português presente no texto deve ser substituída por fontes científicas seguras, reconhecidas e publicadas em inglês (ex: substitua COFEN por NICE, CDC, etc.).
    5. O código traduzido deve ser entregue de forma COMPLETA e INTEGRAL. Não omita partes, não abrevie funções e não tente melhorar ou alterar a estrutura original não solicitada.
    6. Reordene a lista de tags <link rel="alternate" hreflang="..."> dentro do <head> para que a tag correspondente ao idioma alvo ('{target_lang}') seja a primeira da lista (logo após o canonical).
    7. Retorne estritamente o código HTML puro, sem marcadores markdown (como ```html) e sem nenhum texto ou explicação adicional antes ou depois do código.
    8. No <html lang="pt-BR"> no inicio do html troque por <html lang="{lang_region}">. Além disso, se o idioma for árabe (ar), adicione dir="rtl" na tag <html>.

    **REGRAS ADICIONAIS ESPECÍFICAS PARA CAMINHOS DE ARQUIVOS:**

    A) Para os seguintes arquivos modulares, **ajuste o caminho para relativo** (sem barra inicial), pois eles estão dentro da pasta do idioma e já foram traduzidos:
       - global-scripts.js  →  deve virar "global-scripts.js" (sem /)
       - global-body-elements.html  →  deve virar "global-body-elements.html" (sem /)
       - menu-global.html  →  deve virar "menu-global.html" (sem /)
       - footer.html  →  deve virar "footer.html" (sem /)

    B) Para os seguintes arquivos, **mantenha o caminho absoluto** (com /), pois eles ficam na raiz:
       - /global-styles.css
       - /lang-selector.js

    C) **Para os demais recursos** (imagens, fontes, outros scripts, etc.), mantenha o caminho exatamente como está no HTML original.

    D) **SUBSTITUIÇÃO DO BLOCO DE FOOTER** (regra específica para os 18 idiomas):
       - No HTML original (em português), existe um bloco como este:
         <div id="footer-placeholder"></div>
         <script>
           document.addEventListener("DOMContentLoaded", () => {
             setTimeout(() => {
               fetch("/footer.html")
                 .then((response) => response.text())
                 .then((data) => {
                   document.getElementById("footer-placeholder").innerHTML = data;
                   carregarTraducoes("pt", "footer.json");
                   carregarTraducoes("pt", "cookies.json");
                 });
             }, 150);
           });
         </script>
       - **Substitua este bloco inteiro** pelo seguinte bloco (padrão para os 18 idiomas), **sem duplicar** e sem adicionar mais nada:
         <div id="footer-placeholder"></div>
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
         </script>

       - Atenção: não mantenha o código antigo; substitua completamente. Apenas este bloco deve ser alterado; todo o restante do HTML permanece intacto.

    {chunk_info}
    """
    user_prompt = f"Traduza o seguinte HTML para {target_lang}:\n\n{chunk}"

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=8192,
            response_format={"type": "text"}
        )
        translated = response.choices[0].message.content
        return translated
    except Exception as e:
        print(f"❌ Erro na API para chunk: {e}")
        raise


def translate_html_full(content: str, target_lang: str, filename: str) -> str:
    """
    Tenta traduzir o HTML inteiro de uma só vez.
    Se o conteúdo for muito grande, divide em chunks e traduz separadamente.
    """
    lang_region = LANG_REGION_MAP.get(target_lang, f"{target_lang}-{target_lang.upper()}")

    # Se for pequeno, traduz inteiro
    if len(content) <= CHAR_LIMIT_FOR_FULL:
        return translate_chunk(content, target_lang, lang_region, chunk_info="Este é o documento HTML completo.")

    # Caso contrário, divide e traduz por partes
    print(f"⚠️  HTML grande ({len(content)} caracteres). Dividindo em chunks...")
    chunks = split_html_into_chunks(content, max_chars=80000)
    translated_chunks = []

    for i, chunk in enumerate(chunks, start=1):
        print(f"   Traduzindo chunk {i}/{len(chunks)}...")
        chunk_info = f"Este é o chunk {i} de {len(chunks)} do documento HTML completo."
        if i == 1:
            chunk_info += " Este chunk contém o <head> e o início do <body>."
        elif i == len(chunks):
            chunk_info += " Este chunk contém o final do <body> e o fechamento </html>."
        else:
            chunk_info += " Este chunk é uma parte intermediária do <body>."

        translated = translate_chunk(chunk, target_lang, lang_region, chunk_info)
        translated_chunks.append(translated)
        time.sleep(1)  # pequena pausa para evitar rate limit

    # Remove comentários de marcação de chunk que o modelo possa ter mantido
    # e concatena tudo
    final_html = "".join(translated_chunks)
    # Limpa possíveis marcadores duplicados
    final_html = re.sub(r'<!-- INÍCIO DO CHUNK.*?-->', '', final_html)
    final_html = re.sub(r'<!-- FIM DO CHUNK.*?-->', '', final_html)
    return final_html


def process_translations():
    """Função principal que orquestra todo o processo."""
    print("=" * 70)
    print("🚀 INICIANDO PROCESSO DE TRADUÇÃO AUTOMATIZADO")
    print(f"📂 Arquivos a traduzir: {FILES_TO_TRANSLATE}")
    print(f"🌍 Idiomas destino: {TARGET_LANGUAGES}")
    print("=" * 70)

    if not FILES_TO_TRANSLATE:
        print("❌ Nenhum arquivo definido em FILES_TO_TRANSLATE. Encerrando.")
        return

    if not TARGET_LANGUAGES:
        print("❌ Nenhum idioma definido em TARGET_LANGUAGES. Encerrando.")
        return

    # Verifica se o relatório existe, se não, cria com cabeçalho
    if not LOG_FILE.exists():
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write("=== RELATÓRIO DE TRADUÇÕES ===\n")
            f.write(f"Criado em: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 50 + "\n\n")

    for lang in TARGET_LANGUAGES:
        lang_folder = ROOT_DIR / lang
        lang_folder.mkdir(exist_ok=True)

        print(f"\n🌐 --- Processando idioma: {lang} ---")

        for filename in FILES_TO_TRANSLATE:
            source_path = ROOT_DIR / filename
            if not source_path.exists():
                print(f"⚠️  Arquivo fonte {source_path} não encontrado. Pulando.")
                log_translation(filename, lang, "FALHA", "Arquivo fonte não encontrado")
                continue

            print(f"📄 Traduzindo {filename} para {lang}...")
            try:
                with open(source_path, "r", encoding="utf-8") as f:
                    html_content = f.read()

                translated_html = translate_html_full(html_content, lang, filename)

                # Salva na pasta do idioma (sobrescreve se já existir)
                target_path = lang_folder / filename
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(translated_html)

                print(f"✅ Arquivo salvo em: {target_path}")
                log_translation(filename, lang, "SUCESSO")

                # ------------------------------------------------
                # AGORA: executa o build APÓS CADA ARQUIVO traduzido
                # ------------------------------------------------
                print(f"⚙️  Executando build após tradução de {filename} para {lang}...")
                try:
                    run_build()
                    log_translation(filename, lang, "BUILD_SUCESSO", "Build executado com sucesso")
                except Exception as e:
                    print(f"❌ Build falhou para {filename}->{lang}: {e}")
                    log_translation(filename, lang, "BUILD_FALHA", str(e))
                    # Interrompe o processo para evitar inconsistências
                    print("🚨 Build falhou. Interrompendo processo.")
                    sys.exit(1)

            except Exception as e:
                error_msg = str(e)
                print(f"❌ Falha ao traduzir {filename} para {lang}: {error_msg}")
                log_translation(filename, lang, "FALHA", error_msg)
                continue

    print("\n" + "=" * 70)
    print("🎉 PROCESSO DE TRADUÇÃO CONCLUÍDO COM SUCESSO!")
    print(f"📋 Relatório completo salvo em: {LOG_FILE}")
    print("=" * 70)


if __name__ == "__main__":
    process_translations()