# automacoes/traductor_html.py

import os
import re
import sys
import time
import json
import datetime
import subprocess
from pathlib import Path
from typing import List, Optional, Dict

from dotenv import load_dotenv
from openai import OpenAI
from openai import RateLimitError, APIError, APIConnectionError, Timeout

load_dotenv()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not DEEPSEEK_API_KEY:
    print("❌ ERRO: DEEPSEEK_API_KEY não encontrada no arquivo .env")
    sys.exit(1)

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com/v1",
    timeout=30.0,
    max_retries=3
)

# ============================================================
# PARÂMETROS EDITÁVEIS
# ============================================================
FILES_TO_TRANSLATE = [
    "balancohidrico.html",
    # "outra-pagina.html",
]

TARGET_LANGUAGES = [
    "ru",  
]

# ============================================================
# MAPEAMENTO
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

ROOT_DIR = Path(__file__).parent.parent
LOG_FILE = ROOT_DIR / "relatorio_de_traducao.txt"
PROGRESS_DIR = ROOT_DIR / "progresso_traducao"
PROGRESS_DIR.mkdir(exist_ok=True)

BUILD_COMMAND = (
    '.\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify ; '
    'node gerar-sw.js'
)

# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================
def log_translation(filename: str, lang: str, status: str = "SUCESSO", details: str = ""):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{now}] - Arquivo: {filename} | Idioma: {lang} | Status: {status}"
    if details:
        entry += f" | Detalhes: {details}"
    entry += "\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry)
    print(f"📝 LOG: {entry.strip()}")

def run_build():
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

def get_progress_file(filename: str, lang: str) -> Path:
    """Retorna o caminho do arquivo de progresso para uma tradução específica."""
    return PROGRESS_DIR / f"{filename.replace('.html', '')}_{lang}.progress"

def save_progress(filename: str, lang: str, chunk_index: int, total_chunks: int, translated_chunks: List[str]):
    """Salva o progresso da tradução de um arquivo."""
    progress_file = get_progress_file(filename, lang)
    data = {
        "filename": filename,
        "lang": lang,
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "translated_chunks": translated_chunks
    }
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_progress(filename: str, lang: str) -> Optional[Dict]:
    """Carrega o progresso salvo, se existir."""
    progress_file = get_progress_file(filename, lang)
    if progress_file.exists():
        try:
            with open(progress_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except:
            return None
    return None

def clear_progress(filename: str, lang: str):
    """Remove o arquivo de progresso ao finalizar com sucesso."""
    progress_file = get_progress_file(filename, lang)
    if progress_file.exists():
        progress_file.unlink()

def split_html_into_chunks(html: str, max_chars: int = 5000) -> List[str]:
    """
    Divide o HTML em pedaços de, no máximo, max_chars caracteres,
    respeitando o fechamento de tags para não quebrar a estrutura.
    Agora com chunks menores (5.000 caracteres).
    """
    if len(html) <= max_chars:
        return [html]

    head_end = html.find('</head>')
    if head_end == -1:
        head = ''
        body = html
    else:
        head = html[:head_end + 7]
        body = html[head_end + 7:]

    chunks = []
    if len(body) > max_chars:
        start = 0
        while start < len(body):
            end = min(start + max_chars, len(body))
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

    if len(chunks) == 1:
        return [head + chunks[0] + '</html>']
    else:
        first_chunk = head + chunks[0]
        last_chunk = chunks[-1] + '</html>'
        middle_chunks = chunks[1:-1]
        result = [first_chunk]
        for i, chunk in enumerate(middle_chunks, start=2):
            result.append(f"<!-- INÍCIO DO CHUNK {i} DE {len(chunks)} -->\n{chunk}\n<!-- FIM DO CHUNK {i} -->")
        result.append(last_chunk)
        return result

def apply_post_translation_fixes(html_content: str, target_lang: str) -> str:
    """Aplica as correções pós-tradução (caminhos e footer)."""
    relative_files = [
        "global-scripts.js",
        "global-body-elements.html",
        "menu-global.html",
        "footer.html"
    ]
    for file in relative_files:
        pattern = rf'(["\'])/{re.escape(file)}(["\'])'
        replacement = rf'\1{file}\2'
        html_content = re.sub(pattern, replacement, html_content)

    footer_pattern = r'<div\s+id="footer-placeholder"\s*>\s*</div>\s*<script>.*?fetch\s*\(\s*["\']/footer\.html["\']\s*\).*?carregarTraducoes\s*\(.*?\).*?</script>'
    new_footer_block = '''<div id="footer-placeholder"></div>
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
</script>'''
    html_content = re.sub(footer_pattern, new_footer_block, html_content, flags=re.DOTALL | re.IGNORECASE)
    return html_content

def translate_chunk_with_retry(chunk: str, target_lang: str, lang_region: str, chunk_info: str = "", max_retries: int = 5) -> str:
    """Traduz um chunk com retry e backoff exponencial."""
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

    Atenção: Preserve todos os IDs, classes, caminhos de arquivos, scripts e estilos CSS intactos. Traduza APENAS o texto visível ao usuário e os metadados de SEO.
    {chunk_info}
    """
    user_prompt = f"Traduza o seguinte HTML para {target_lang}:\n\n{chunk}"

    for attempt in range(max_retries):
        try:
            # Pausa progressiva: 3s, 6s, 12s, 24s, 48s...
            if attempt > 0:
                wait = 3 * (2 ** (attempt - 1))
                print(f"   ⏳ Aguardando {wait}s antes da tentativa {attempt+1}...")
                time.sleep(wait)

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

            # Verifica se o chunk está completo (contém </html>)
            if '<html' in translated and '</html>' in translated:
                translated = apply_post_translation_fixes(translated, target_lang)
                return translated
            else:
                print(f"   ⚠️  Chunk incompleto (faltando </html>). Tentativa {attempt+1} de {max_retries}.")
                if attempt == max_retries - 1:
                    print("   ❌ Chunk ainda incompleto após todas as tentativas. Retornando parcial.")
                    return translated

        except (RateLimitError, APIError, APIConnectionError, Timeout) as e:
            print(f"   ⚠️  Erro de API: {e}. Tentativa {attempt+1} de {max_retries}.")
            if attempt == max_retries - 1:
                raise  # se for a última, propaga a exceção
            continue
        except Exception as e:
            print(f"   ❌ Erro inesperado: {e}. Tentativa {attempt+1} de {max_retries}.")
            if attempt == max_retries - 1:
                raise
            continue

    raise RuntimeError("Falha ao traduzir chunk após múltiplas tentativas.")

def translate_html_full(content: str, target_lang: str, filename: str) -> str:
    """Traduz o HTML completo, usando chunking e checkpoint."""
    lang_region = LANG_REGION_MAP.get(target_lang, f"{target_lang}-{target_lang.upper()}")

    # Verifica se há progresso salvo
    progress = load_progress(filename, target_lang)
    if progress:
        print(f"🔄 Retomando tradução de {filename} para {target_lang} a partir do chunk {progress['chunk_index']+1}...")
        translated_chunks = progress["translated_chunks"]
        start_index = progress["chunk_index"]
    else:
        # Divide em chunks
        chunks = split_html_into_chunks(content, max_chars=5000)
        total_chunks = len(chunks)
        translated_chunks = []
        start_index = 0
        # Salva progresso inicial
        save_progress(filename, target_lang, 0, total_chunks, [])

    # Se já havia progresso, recupera os chunks originais (não temos como salvar os chunks originais,
    # então vamos recriar a lista)
    if 'chunks' not in locals():
        chunks = split_html_into_chunks(content, max_chars=5000)
        total_chunks = len(chunks)

    for i in range(start_index, len(chunks)):
        chunk = chunks[i]
        print(f"   Traduzindo chunk {i+1}/{len(chunks)} (tamanho: {len(chunk)} caracteres)...")
        chunk_info = f"Este é o chunk {i+1} de {len(chunks)} do documento HTML completo."
        if i == 0:
            chunk_info += " Este chunk contém o <head> e o início do <body>."
        elif i == len(chunks)-1:
            chunk_info += " Este chunk contém o final do <body> e o fechamento </html>."
        else:
            chunk_info += " Este chunk é uma parte intermediária do <body>."

        try:
            translated = translate_chunk_with_retry(chunk, target_lang, lang_region, chunk_info)
            translated_chunks.append(translated)
            # Salva progresso após cada chunk
            save_progress(filename, target_lang, i+1, len(chunks), translated_chunks)
            print(f"   ✅ Chunk {i+1} traduzido. Progresso salvo.")
            # Pausa adicional entre chunks para evitar rate limit
            time.sleep(2)
        except Exception as e:
            print(f"   ❌ Falha crítica no chunk {i+1}: {e}")
            # Salva o progresso até o último chunk bem-sucedido
            save_progress(filename, target_lang, i, len(chunks), translated_chunks)
            raise

    # Junta todos os chunks
    final_html = "".join(translated_chunks)
    # Remove marcadores de chunk
    final_html = re.sub(r'<!-- INÍCIO DO CHUNK.*?-->', '', final_html)
    final_html = re.sub(r'<!-- FIM DO CHUNK.*?-->', '', final_html)

    # Remove marcadores que possam ter ficado
    final_html = re.sub(r'<!-- INÍCIO DO CHUNK \d+ DE \d+ -->', '', final_html)
    final_html = re.sub(r'<!-- FIM DO CHUNK \d+ -->', '', final_html)

    # Limpa progresso após sucesso
    clear_progress(filename, target_lang)
    return final_html

# ============================================================
# PROCESSO PRINCIPAL
# ============================================================
def process_translations():
    print("=" * 70)
    print("🚀 INICIANDO PROCESSO DE TRADUÇÃO AUTOMATIZADO")
    print(f"📂 Arquivos a traduzir: {FILES_TO_TRANSLATE}")
    print(f"🌍 Idiomas destino: {TARGET_LANGUAGES}")
    print("=" * 70)

    if not FILES_TO_TRANSLATE or not TARGET_LANGUAGES:
        print("❌ Lista de arquivos ou idiomas vazia. Encerrando.")
        return

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

                target_path = lang_folder / filename
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(translated_html)

                print(f"✅ Arquivo salvo em: {target_path}")
                log_translation(filename, lang, "SUCESSO")

                # Build após cada arquivo
                print(f"⚙️  Executando build após tradução de {filename} para {lang}...")
                try:
                    run_build()
                    log_translation("BUILD", lang, "SUCESSO", f"Build executado após {filename}")
                except Exception as e:
                    print(f"❌ Build falhou para {filename}->{lang}: {e}")
                    log_translation("BUILD", lang, "FALHA", str(e))
                    print("🚨 Build falhou. Interrompendo processo para evitar inconsistências.")
                    sys.exit(1)

            except Exception as e:
                error_msg = str(e)
                print(f"❌ Falha ao traduzir {filename} para {lang}: {error_msg}")
                log_translation(filename, lang, "FALHA", error_msg)
                # Não interrompe o processo; apenas continua para o próximo arquivo
                continue

    print("\n" + "=" * 70)
    print("🎉 PROCESSO DE TRADUÇÃO CONCLUÍDO COM SUCESSO!")
    print(f"📋 Relatório completo salvo em: {LOG_FILE}")
    print("=" * 70)

if __name__ == "__main__":
    process_translations()