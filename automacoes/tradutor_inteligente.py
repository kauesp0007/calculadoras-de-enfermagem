import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import deepl
from deepl.exceptions import QuotaExceededException, TooManyRequestsException
import re
import sys

# Adiciona diretório atual ao path para importar o módulo IA
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from tradutor_html_ia import traduzir_html_completo as _traduzir_html_via_ia
    _IA_DISPONIVEL = True
except ImportError:
    _IA_DISPONIVEL = False
    print("⚠️ Módulo tradutor_html_ia.py não encontrado. Fallback IA indisponível.")
import requests
import json
import time

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPL_API_KEY")
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
CHAVE_OPENAI = os.getenv("OPENAI_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPL_API_KEY.")
if not CHAVE_DEEPSEEK:
    raise ValueError("Chave do DeepSeek não encontrada. Adicione DEEPSEEK_API_KEY no arquivo .env para traduzir os scripts dinâmicos.")

# ============================================================
# DICIONÁRIO DE STRINGS UI QUE PRECISAM SER TRADUZIDAS
# Strings comuns em JavaScript/HTML que tradutores automáticos
# frequentemente ignoram por estarem dentro de <script> ou
# atributos HTML. Este dicionário serve como referência e
# fallback para o processo de tradução.
# ============================================================

DICIONARIO_STRINGS_UI = {
    # ── Status / Resultados ──
    "POSITIVO": {
        "ar": "إيجابي", "de": "POSITIV", "en": "POSITIVE", "es": "POSITIVO",
        "fr": "POSITIF", "hi": "सकारात्मक", "id": "POSITIF", "it": "POSITIVO",
        "ja": "陽性", "ko": "양성", "nl": "POSITIEF", "pl": "POZYTYWNY",
        "ru": "ПОЛОЖИТЕЛЬНЫЙ", "sv": "POSITIV", "tr": "POZİTİF",
        "uk": "ПОЗИТИВНИЙ", "vi": "DƯƠNG TÍNH", "zh": "阳性"
    },
    "NEGATIVO": {
        "ar": "سلبي", "de": "NEGATIV", "en": "NEGATIVE", "es": "NEGATIVO",
        "fr": "NÉGATIF", "hi": "नकारात्मक", "id": "NEGATIF", "it": "NEGATIVO",
        "ja": "陰性", "ko": "음성", "nl": "NEGATIEF", "pl": "NEGATYWNY",
        "ru": "ОТРИЦАТЕЛЬНЫЙ", "sv": "NEGATIV", "tr": "NEGATİF",
        "uk": "НЕГАТИВНИЙ", "vi": "ÂM TÍNH", "zh": "阴性"
    },
    
    # ── Presença / Ausência ──
    "Presente": {
        "ar": "موجود", "de": "Vorhanden", "en": "Present", "es": "Presente",
        "fr": "Présent", "hi": "उपस्थित", "id": "Ada", "it": "Presente",
        "ja": "あり", "ko": "있음", "nl": "Aanwezig", "pl": "Obecny",
        "ru": "Присутствует", "sv": "Närvarande", "tr": "Mevcut",
        "uk": "Присутній", "vi": "Có mặt", "zh": "存在"
    },
    "Ausente": {
        "ar": "غائب", "de": "Abwesend", "en": "Absent", "es": "Ausente",
        "fr": "Absent", "hi": "अनुपस्थित", "id": "Tidak Ada", "it": "Assente",
        "ja": "なし", "ko": "없음", "nl": "Afwezig", "pl": "Nieobecny",
        "ru": "Отсутствует", "sv": "Frånvarande", "tr": "Yok",
        "uk": "Відсутній", "vi": "Vắng mặt", "zh": "不存在"
    },
    
    # ── Sim / Não ──
    "Sim": {
        "ar": "نعم", "de": "Ja", "en": "Yes", "es": "Sí",
        "fr": "Oui", "hi": "हाँ", "id": "Ya", "it": "Sì",
        "ja": "はい", "ko": "예", "nl": "Ja", "pl": "Tak",
        "ru": "Да", "sv": "Ja", "tr": "Evet",
        "uk": "Так", "vi": "Có", "zh": "是"
    },
    "Não": {
        "ar": "لا", "de": "Nein", "en": "No", "es": "No",
        "fr": "Non", "hi": "नहीं", "id": "Tidak", "it": "No",
        "ja": "いいえ", "ko": "아니요", "nl": "Nee", "pl": "Nie",
        "ru": "Нет", "sv": "Nej", "tr": "Hayır",
        "uk": "Ні", "vi": "Không", "zh": "否"
    },
    
    # ── SIM / NÃO (maiúsculas para impressão/PDF) ──
    "SIM": {
        "ar": "نعم", "de": "JA", "en": "YES", "es": "SÍ",
        "fr": "OUI", "hi": "हाँ", "id": "YA", "it": "SÌ",
        "ja": "はい", "ko": "예", "nl": "JA", "pl": "TAK",
        "ru": "ДА", "sv": "JA", "tr": "EVET",
        "uk": "ТАК", "vi": "CÓ", "zh": "是"
    },
    "NÃO": {
        "ar": "لا", "de": "NEIN", "en": "NO", "es": "NO",
        "fr": "NON", "hi": "नहीं", "id": "TIDAK", "it": "NO",
        "ja": "いいえ", "ko": "아니요", "nl": "NEE", "pl": "NIE",
        "ru": "НЕТ", "sv": "NEJ", "tr": "HAYIR",
        "uk": "НІ", "vi": "KHÔNG", "zh": "否"
    },
    
    # ── Ações / Botões ──
    "Calcular": {
        "ar": "حساب", "de": "Berechnen", "en": "Calculate", "es": "Calcular",
        "fr": "Calculer", "hi": "गणना करें", "id": "Hitung", "it": "Calcola",
        "ja": "計算", "ko": "계산", "nl": "Berekenen", "pl": "Oblicz",
        "ru": "Рассчитать", "sv": "Beräkna", "tr": "Hesapla",
        "uk": "Розрахувати", "vi": "Tính toán", "zh": "计算"
    },
    "Limpar": {
        "ar": "مسح", "de": "Löschen", "en": "Clear", "es": "Limpiar",
        "fr": "Effacer", "hi": "साफ करें", "id": "Hapus", "it": "Cancella",
        "ja": "クリア", "ko": "지우기", "nl": "Wissen", "pl": "Wyczyść",
        "ru": "Очистить", "sv": "Rensa", "tr": "Temizle",
        "uk": "Очистити", "vi": "Xóa", "zh": "清除"
    },
    "Imprimir": {
        "ar": "طباعة", "de": "Drucken", "en": "Print", "es": "Imprimir",
        "fr": "Imprimer", "hi": "प्रिंट", "id": "Cetak", "it": "Stampa",
        "ja": "印刷", "ko": "인쇄", "nl": "Afdrukken", "pl": "Drukuj",
        "ru": "Печать", "sv": "Skriv ut", "tr": "Yazdır",
        "uk": "Друк", "vi": "In", "zh": "打印"
    },
    
    # ── Alertas / Validação ──
    "Preencha todos os campos": {
        "ar": "املأ جميع الحقول", "de": "Bitte alle Felder ausfüllen",
        "en": "Please fill in all fields", "es": "Complete todos los campos",
        "fr": "Veuillez remplir tous les champs", "hi": "कृपया सभी फ़ील्ड भरें",
        "id": "Harap isi semua kolom", "it": "Compila tutti i campi",
        "ja": "すべての項目を入力してください", "ko": "모든 필드를 입력하세요",
        "nl": "Vul alle velden in", "pl": "Wypełnij wszystkie pola",
        "ru": "Заполните все поля", "sv": "Fyll i alla fält",
        "tr": "Lütfen tüm alanları doldurun", "uk": "Заповніть усі поля",
        "vi": "Vui lòng điền tất cả các trường", "zh": "请填写所有字段"
    },
    "Selecione uma opção": {
        "ar": "حدد خياراً", "de": "Bitte eine Option wählen",
        "en": "Select an option", "es": "Seleccione una opción",
        "fr": "Sélectionnez une option", "hi": "एक विकल्प चुनें",
        "id": "Pilih opsi", "it": "Seleziona un'opzione",
        "ja": "オプションを選択", "ko": "옵션을 선택하세요",
        "nl": "Selecteer een optie", "pl": "Wybierz opcję",
        "ru": "Выберите вариант", "sv": "Välj ett alternativ",
        "tr": "Bir seçenek seçin", "uk": "Виберіть варіант",
        "vi": "Chọn một tùy chọn", "zh": "选择一个选项"
    },
    
    # ── Placeholders de <select> / Comentários em dropdowns ──
    # Strings que aparecem como primeira opção desabilitada em <select>
    "Selecione...": {
        "ar": "حدد...", "de": "Auswählen...", "en": "Select...",
        "es": "Seleccionar...", "fr": "Sélectionner...",
        "hi": "चुनें...", "id": "Pilih...", "it": "Seleziona...",
        "ja": "選択...", "ko": "선택...", "nl": "Selecteren...",
        "pl": "Wybierz...", "ru": "Выберите...", "sv": "Välj...",
        "tr": "Seçiniz...", "uk": "Виберіть...",
        "vi": "Chọn...", "zh": "请选择..."
    },
    "Selecione uma opção...": {
        "ar": "حدد خياراً...", "de": "Option auswählen...",
        "en": "Select an option...", "es": "Seleccione una opción...",
        "fr": "Sélectionnez une option...", "hi": "एक विकल्प चुनें...",
        "id": "Pilih opsi...", "it": "Seleziona un'opzione...",
        "ja": "オプションを選択...", "ko": "옵션을 선택하세요...",
        "nl": "Selecteer een optie...", "pl": "Wybierz opcję...",
        "ru": "Выберите вариант...", "sv": "Välj ett alternativ...",
        "tr": "Bir seçenek seçin...", "uk": "Виберіть варіант...",
        "vi": "Chọn một tùy chọn...", "zh": "请选择一个选项..."
    },
    "Escolha...": {
        "ar": "اختر...", "de": "Wählen...", "en": "Choose...",
        "es": "Elegir...", "fr": "Choisir...",
        "hi": "चुनें...", "id": "Pilih...", "it": "Scegli...",
        "ja": "選ぶ...", "ko": "고르기...", "nl": "Kies...",
        "pl": "Wybierz...", "ru": "Выбрать...", "sv": "Välj...",
        "tr": "Seç...", "uk": "Обрати...",
        "vi": "Chọn...", "zh": "选择..."
    },
    "Selecionar...": {
        "ar": "تحديد...", "de": "Auswählen...", "en": "Select...",
        "es": "Seleccionar...", "fr": "Sélectionner...",
        "hi": "चयन करें...", "id": "Memilih...", "it": "Selezionare...",
        "ja": "選択する...", "ko": "선택하기...", "nl": "Selecteren...",
        "pl": "Wybieranie...", "ru": "Выбор...", "sv": "Välja...",
        "tr": "Seçme...", "uk": "Вибір...",
        "vi": "Lựa chọn...", "zh": "选择..."
    },
    "Selecione a classificação": {
        "ar": "حدد التصنيف", "de": "Klassifizierung wählen",
        "en": "Select classification", "es": "Seleccione la clasificación",
        "fr": "Sélectionnez la classification", "hi": "वर्गीकरण चुनें",
        "id": "Pilih klasifikasi", "it": "Seleziona la classificazione",
        "ja": "分類を選択", "ko": "분류 선택",
        "nl": "Selecteer classificatie", "pl": "Wybierz klasyfikację",
        "ru": "Выберите классификацию", "sv": "Välj klassificering",
        "tr": "Sınıflandırma seçin", "uk": "Виберіть класифікацію",
        "vi": "Chọn phân loại", "zh": "选择分类"
    },
    
    # ── Formulário / Dados do Paciente ──
    "Paciente": {
        "ar": "المريض", "de": "Patient", "en": "Patient", "es": "Paciente",
        "fr": "Patient", "hi": "रोगी", "id": "Pasien", "it": "Paziente",
        "ja": "患者", "ko": "환자", "nl": "Patiënt", "pl": "Pacjent",
        "ru": "Пациент", "sv": "Patient", "tr": "Hasta",
        "uk": "Пацієнт", "vi": "Bệnh nhân", "zh": "患者"
    },
    "Idade": {
        "ar": "العمر", "de": "Alter", "en": "Age", "es": "Edad",
        "fr": "Âge", "hi": "आयु", "id": "Usia", "it": "Età",
        "ja": "年齢", "ko": "나이", "nl": "Leeftijd", "pl": "Wiek",
        "ru": "Возраст", "sv": "Ålder", "tr": "Yaş",
        "uk": "Вік", "vi": "Tuổi", "zh": "年龄"
    },
    "Data": {
        "ar": "التاريخ", "de": "Datum", "en": "Date", "es": "Fecha",
        "fr": "Date", "hi": "दिनांक", "id": "Tanggal", "it": "Data",
        "ja": "日付", "ko": "날짜", "nl": "Datum", "pl": "Data",
        "ru": "Дата", "sv": "Datum", "tr": "Tarih",
        "uk": "Дата", "vi": "Ngày", "zh": "日期"
    },
    
    # ── Resultado / Diagnóstico ──
    "Resultado": {
        "ar": "النتيجة", "de": "Ergebnis", "en": "Result", "es": "Resultado",
        "fr": "Résultat", "hi": "परिणाम", "id": "Hasil", "it": "Risultato",
        "ja": "結果", "ko": "결과", "nl": "Resultaat", "pl": "Wynik",
        "ru": "Результат", "sv": "Resultat", "tr": "Sonuç",
        "uk": "Результат", "vi": "Kết quả", "zh": "结果"
    },
    "Risco Baixo": {
        "ar": "خطر منخفض", "de": "Niedriges Risiko", "en": "Low Risk",
        "es": "Riesgo Bajo", "fr": "Risque Faible", "hi": "कम जोखिम",
        "id": "Risiko Rendah", "it": "Rischio Basso", "ja": "低リスク",
        "ko": "낮은 위험", "nl": "Laag Risico", "pl": "Niskie Ryzyko",
        "ru": "Низкий риск", "sv": "Låg Risk", "tr": "Düşük Risk",
        "uk": "Низький ризик", "vi": "Nguy cơ Thấp", "zh": "低风险"
    },
    "Risco Moderado": {
        "ar": "خطر متوسط", "de": "Mittleres Risiko", "en": "Moderate Risk",
        "es": "Riesgo Moderado", "fr": "Risque Modéré", "hi": "मध्यम जोखिम",
        "id": "Risiko Sedang", "it": "Rischio Moderato", "ja": "中リスク",
        "ko": "중간 위험", "nl": "Matig Risico", "pl": "Umiarkowane Ryzyko",
        "ru": "Средний риск", "sv": "Måttlig Risk", "tr": "Orta Risk",
        "uk": "Помірний ризик", "vi": "Nguy cơ Trung bình", "zh": "中等风险"
    },
    "Risco Alto": {
        "ar": "خطر مرتفع", "de": "Hohes Risiko", "en": "High Risk",
        "es": "Riesgo Alto", "fr": "Risque Élevé", "hi": "उच्च जोखिम",
        "id": "Risiko Tinggi", "it": "Rischio Alto", "ja": "高リスク",
        "ko": "높은 위험", "nl": "Hoog Risico", "pl": "Wysokie Ryzyko",
        "ru": "Высокий риск", "sv": "Hög Risk", "tr": "Yüksek Risk",
        "uk": "Високий ризик", "vi": "Nguy cơ Cao", "zh": "高风险"
    },
}

def obter_traducao_ui(texto_original, idioma_alvo):
    """
    Consulta o dicionário de strings UI para obter uma tradução pré-definida.
    Retorna None se a string não estiver no dicionário.
    """
    if texto_original in DICIONARIO_STRINGS_UI:
        return DICIONARIO_STRINGS_UI[texto_original].get(idioma_alvo)
    return None

def traduzir_meta_seo_com_deepseek(html, idioma_alvo):
    """
    Isola os conteúdos das tags de SEO e traduz de forma independente usando o DeepSeek,
    garantindo adaptação cultural e de palavras-chave.
    Funciona com content="..." antes OU depois de name/property="..." (formato XHTML).
    """
    campos = r'(?:description|keywords|og:title|og:description|og:site_name|twitter:title|twitter:description|author)'
    
    # Padrão 1: content="..." ... name|property="campo" (formato XHTML mais comum)
    p1 = re.compile(rf'(<meta\s+content=")([^"]+)("[^>]*?(?:name|property)="{campos}"[^>]*/?>)', re.IGNORECASE)
    # Padrão 2: name|property="campo" ... content="..." (formato alternativo)
    p2 = re.compile(rf'(<meta\s+(?:name|property)="{campos}"[^>]*?content=")([^"]+)("[^>]*/?>)', re.IGNORECASE)
    
    matches = []
    for p in [p1, p2]:
        for m in p.finditer(html):
            matches.append(m)
    
    # Remove duplicatas (mesma posição no HTML)
    seen = set()
    unique_matches = []
    for m in matches:
        if m.start() not in seen:
            seen.add(m.start())
            unique_matches.append(m)
    
    if not unique_matches:
        return html
        
    # Extrai os textos em PT para um dicionário (JSON)
    dict_textos = {f"t{i}": m.group(2) for i, m in enumerate(unique_matches)}
    
    instrucoes = f"""
    Você é um especialista em SEO internacional e localização na área da saúde/enfermagem.
    Traduza os valores num JSON do Português para o idioma com o código ISO '{idioma_alvo}'.
    
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave com maior volume de busca na enfermagem neste idioma alvo.
    2. NÃO modifique as chaves do JSON.
    3. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem explicações e sem marcações markdown.
    """
    
    # URL LIMPA: sem formatação de colchetes!
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": json.dumps(dict_textos, ensure_ascii=False)}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=45)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # Substitui no HTML original (de trás para frente para não afetar os índices)
        html_modificado = html
        for i, m in reversed(list(enumerate(unique_matches))):
            chave = f"t{i}"
            if chave in traducoes:
                novo_texto = traducoes[chave].replace('"', "'") # Proteção contra aspas acidentais no HTML
                bloco_novo = m.group(1) + novo_texto + m.group(3)
                html_modificado = html_modificado[:m.start()] + bloco_novo + html_modificado[m.end():]
                
        return html_modificado
    except Exception as e:
        print(f"\n⚠️ Erro ao adaptar SEO com DeepSeek (mantendo SEO original): {e}")
        return html

def preparar_html_para_traducao_texto(caminho_arquivo, idioma_alvo):
    """
    Trata o HTML puramente como texto, garantindo rotas, footer, SEO, hreflang,
    canonical e tags principais sejam ajustados com alta precisão.
    """
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html = f.read()

    # ==========================================
    # 1. SUBSTITUIÇÃO CIRÚRGICA DO FOOTER E ROTAS (INTACTO)
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

    regras_rotas = {
        'href="global-styles.css"': 'href="/global-styles.css"',
        'href="./global-styles.css"': 'href="/global-styles.css"',
        'src="lang-selector.js"': 'src="/lang-selector.js"',
        'src="./lang-selector.js"': 'src="/lang-selector.js"',
        'href="_language_selector.html"': 'href="/_language_selector.html"',
        'href="./_language_selector.html"': 'href="/_language_selector.html"',
        'href="manifest.json"': 'href="/manifest.json"',
        'src="ce-calculadora-padrao.js"': 'src="/ce-calculadora-padrao.js"',
        'src="/global-scripts.js"': 'src="/global-scripts.js"',
        'src=".global-scripts.js"': 'src="/global-scripts.js"',
        'href="/global-body-elements.html"': 'href="global-body-elements.html"',
        'href="./global-body-elements.html"': 'href="global-body-elements.html"',
        'href="/menu-global.html"': 'href="menu-global.html"',
        'href="./menu-global.html"': 'href="menu-global.html"',
        'src="img/': 'src="/img/',
        'src="../img/': 'src="/img/'
    }

    for antigo, novo in regras_rotas.items():
        html = html.replace(antigo, novo)

    # ==========================================
    # 2. ATUALIZAR A TAG LANG HTML
    # ==========================================
    mapa_locales = {
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
    
    locale_completo = mapa_locales.get(idioma_alvo, idioma_alvo)
    html = re.sub(r'<html\s+lang="pt-BR">', f'<html lang="{locale_completo}">', html, flags=re.IGNORECASE)

    # ==========================================
    # 2.1 ATUALIZAR OG:LOCALE, OG:URL E OUTRAS METAS FIXAS
    # ==========================================
    og_locale = locale_completo.replace("-", "_")  # hi-IN → hi_IN
    html = re.sub(
        r'<meta\s+content="pt_BR"\s+property="og:locale"\s*/?>',
        f'<meta content="{og_locale}" property="og:locale"/>',
        html, flags=re.IGNORECASE
    )
    # Atualiza og:url com o caminho do idioma
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+property="og:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    # Atualiza twitter:url se existir
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+name="twitter:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    # Atualiza og:image para usar a bandeira correta do idioma
    mapa_bandeiras = {
        "en": "bandeira-eua", "es": "bandeira-espanha", "fr": "bandeira-franca",
        "it": "bandeira-italia", "de": "bandeira-alemanha", "hi": "bandeira-india",
        "zh": "bandeira-china", "ja": "bandeira-japao", "ru": "bandeira-russia",
        "ko": "bandeira-coreia-sul", "tr": "bandeira-turquia", "nl": "bandeira-holanda",
        "pl": "bandeira-polonia", "sv": "bandeira-suecia", "id": "bandeira-indonesia",
        "vi": "bandeira-vietna", "uk": "bandeira-ucrania", "ar": "bandeira-arabia-saudita"
    }
    if idioma_alvo in mapa_bandeiras:
        html = re.sub(
            r'bandeira-[a-z-]+\.webp',
            f'{mapa_bandeiras[idioma_alvo]}.webp',
            html, flags=re.IGNORECASE
        )

    # ==========================================
    # 3. ATUALIZAR LINK CANONICAL (ordem-independente, XHTML/HTML)
    # ==========================================
    # Lookaheads: encontra canonical com href="..." e rel="canonical" em qualquer ordem
    match_canonical = re.search(
        r'<link\s+'
        r'(?=[^>]*\brel="canonical")'
        r'(?=[^>]*\bhref="https://www\.calculadorasdeenfermagem\.com\.br(?:/[a-z]{2}(?:-[A-Z]{2})?)?/([^"]+)")'
        r'[^>]*/?>',
        html, re.IGNORECASE
    )
    if match_canonical:
        filename = match_canonical.group(1)
        novo_canonical = f'<link href="https://www.calculadorasdeenfermagem.com.br/{idioma_alvo}/{filename}" rel="canonical"/>'
        html = html[:match_canonical.start()] + novo_canonical + html[match_canonical.end():]

    # ==========================================
    # 4. HREFLANG: SWAP INTELIGENTE + REORDENACAO (ordem-independente)
    # ==========================================
    # Estrategia:
    #   1. A tag pt-br (URL em portugues) vira o idioma alvo (URL traduzida)
    #   2. A tag do idioma alvo (ja existente) vira pt-br (URL em portugues)
    #   3. Resultado: idioma alvo primeiro, sem duplicidade
    # Regex com lookaheads: hreflang, href e rel="alternate" em QUALQUER ordem
    padrao_hreflang = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="alternate")'
        r'(?=[^>]*\bhreflang="([^"]+)")'
        r'(?=[^>]*\bhref="([^"]+)")'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    hreflang_matches = list(padrao_hreflang.finditer(html))
    
    if hreflang_matches:
        start_idx = hreflang_matches[0].start()
        end_idx = hreflang_matches[-1].end()
        
        # Parse todas as entradas: lang, url
        entries = []
        for m in hreflang_matches:
            entries.append({'lang': m.group(1), 'url': m.group(2)})
        
        # Encontra pt-br e idioma alvo
        idx_pt = None
        idx_alvo = None
        for i, e in enumerate(entries):
            if e['lang'].lower() == 'pt-br':
                idx_pt = i
            if e['lang'].lower() == idioma_alvo.lower():
                idx_alvo = i
        
        # SWAP: troca idiomas e URLs entre pt-br e idioma alvo
        if idx_pt is not None and idx_alvo is not None:
            url_pt = entries[idx_pt]['url']
            url_alvo = entries[idx_alvo]['url']
            entries[idx_pt]['lang'] = idioma_alvo
            entries[idx_pt]['url'] = url_alvo
            entries[idx_alvo]['lang'] = 'pt-br'
            entries[idx_alvo]['url'] = url_pt
        
        # Reconstrói todas as tags com formato consistente
        novas_tags = []
        for e in entries:
            novas_tags.append(
                f'<link href="{e["url"]}" hreflang="{e["lang"]}" rel="alternate"/>'
            )
        
        # Reordena: idioma alvo PRIMEIRO
        tag_alvo_str = None
        tags_restantes = []
        for tag in novas_tags:
            if f'hreflang="{idioma_alvo}"' in tag.lower():
                tag_alvo_str = tag
            else:
                tags_restantes.append(tag)
        
        tags_finais = [tag_alvo_str] + tags_restantes if tag_alvo_str else novas_tags
        bloco_novo = "\n    ".join(tags_finais)
        html = html[:start_idx] + bloco_novo + html[end_idx:]

    # ==========================================
    # 5. AJUSTE CIRÚRGICO DE FONTES ESPECÍFICAS
    # ==========================================
    fontes_especificas = {
        "ar": {
            "css": "@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "zh": {
            "css": "@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "hi": {
            "css": "@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "ja": {
            "css": "@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "ko": {
            "css": "@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>'
        }
    }

    if idioma_alvo in fontes_especificas:
        font_info = fontes_especificas[idioma_alvo]
        
        # === PARTE 1: CSS @font-face no <style id="critical-fonts"> ===
        tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
        if re.search(tag_style, html, re.IGNORECASE):
            html = re.sub(tag_style, rf'\1{font_info["css"]}\n    ', html, count=1, flags=re.IGNORECASE)
        else:
            html = re.sub(
                r'(<style[^>]*>)',
                rf'\1\n    {font_info["css"]}',
                html, count=1, flags=re.IGNORECASE
            )
        
        # Remove @font-face originais de Inter e Nunito do CSS
        html = re.sub(
            r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans|Nunito)[\'"][^\}]+\}\s*',
            '', html, flags=re.IGNORECASE
        )

        # === PARTE 2: Preloads — SUBSTITUIÇÃO CIRÚRGICA NO LOCAL EXATO ===
        # Regex com lookaheads: encontra <link> com rel="preload" E href="...inter/nunito..."
        # em QUALQUER ordem de atributos (compatível com todos os formatos HTML/XHTML)
        padrao_fonte_preload = re.compile(
            r'<link\s+'
            r'(?=[^>]*\brel="preload")'           # lookahead: tem rel="preload"
            r'(?=[^>]*\bhref="[^"]*/(?:inter|nunito)[^"]*")'  # lookahead: href aponta para Inter/Nunito
            r'[^>]*/?>',                           # consome a tag inteira
            re.IGNORECASE
        )
        
        # Encontra TODOS os preloads de fontes Inter/Nunito no HTML
        matches_fontes = list(padrao_fonte_preload.finditer(html))
        
        if matches_fontes:
            # Estratégia: substitui o PRIMEIRO match pelos novos preloads,
            # depois remove TODOS os demais (incluindo o primeiro que já foi substituído)
            
            # 1. Substitui o primeiro preload antigo pelos novos
            primeiro = matches_fontes[0]
            html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
            
            # 2. Re-escaneia e remove TODOS os preloads de Inter/Nunito restantes
            # (o primeiro já foi substituído, então só os outros serão encontrados)
            html = padrao_fonte_preload.sub('', html)
            
            # 3. Remove linhas em branco duplicadas que possam ter ficado
            html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
        else:
            # Fallback absoluto: se não encontrou por lookaheads, tenta regex simples
            # que captura href="/fonts/inter/..." ou href="/fonts/nunito/..."
            padrao_fallback = re.compile(
                r'<link\s+[^>]*href="[^"]*/(?:inter|nunito)[^"]*"[^>]*/?>',
                re.IGNORECASE
            )
            matches_fallback = list(padrao_fallback.finditer(html))
            if matches_fallback:
                primeiro = matches_fallback[0]
                html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
                html = padrao_fallback.sub('', html)
                html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)

    # ==========================================
    # 6. TRADUZIR META TAGS SEO CIRURGICAMENTE
    # ==========================================
    html = traduzir_meta_seo_com_deepseek(html, idioma_alvo)

    return html

def _extrair_interpolacoes(texto):
    """
    Extrai TODAS as interpolações ${...} completas de um texto,
    lidando corretamente com chaves aninhadas (ex: ${fn({a:1})}).
    
    Ao contrário da regex que para na primeira },
    esta função rastreia a profundidade de chaves para capturar
    a interpolação inteira.
    """
    interps = []
    i = 0
    while i < len(texto):
        if texto[i:i+2] == '${':
            inicio = i
            depth = 1
            j = i + 2
            while j < len(texto) and depth > 0:
                if texto[j] == '{':
                    depth += 1
                elif texto[j] == '}':
                    depth -= 1
                j += 1
            interps.append(texto[inicio:j])
            i = j
        else:
            i += 1
    return interps


def _extrair_template_literals(codigo_js):
    """
    Extrai template literals COMPLETOS do JavaScript, lidando corretamente
    com backticks aninhados dentro de ${...} (ex: ${x ? `a` : `b`}).
    
    Ao contrário da regex `([^`]*)` que quebra no primeiro backtick,
    esta função rastreia o aninhamento de chaves ${ } para determinar
    se um backtick pertence a um template aninhado ou ao fechamento do
    template externo.
    
    Retorna lista de tuplas (match_completo, conteudo) onde:
    - match_completo: string completa incluindo os backticks delimitadores
    - conteudo: apenas o texto entre os backticks
    """
    resultados = []
    i = 0
    while i < len(codigo_js):
        # Encontra backtick de abertura (não escapado)
        if codigo_js[i] == '`' and (i == 0 or codigo_js[i-1] != '\\'):
            inicio = i
            brace_depth = 0  # profundidade de ${...}
            j = i + 1
            while j < len(codigo_js):
                c = codigo_js[j]
                # Detecta abertura de interpolação ${
                if c == '$' and j+1 < len(codigo_js) and codigo_js[j+1] == '{':
                    brace_depth += 1
                    j += 2
                    continue
                # Detecta abertura de chave dentro de interpolação (ex: objetos, funções)
                elif c == '{' and brace_depth > 0:
                    brace_depth += 1
                # Detecta fechamento de chave dentro de interpolação
                elif c == '}' and brace_depth > 0:
                    brace_depth -= 1
                # Backtick: só fecha o template externo se brace_depth == 0
                elif c == '`' and brace_depth == 0:
                    match_completo = codigo_js[inicio:j+1]
                    conteudo = codigo_js[inicio+1:j]
                    resultados.append((match_completo, conteudo))
                    i = j + 1
                    break
                j += 1
            else:
                # Não encontrou fechamento — avança 1 char para não travar
                i += 1
        else:
            i += 1
    return resultados


def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    """
    Função otimizada que extrai as strings do JS antes de enviar para a IA,
    evitando que a IA corrompa a sintaxe do código (como template literals).
    """
    # 1. Extração cirúrgica de strings do JavaScript
    strings_para_traduzir = {}
    mapeamento_scripts = {}
    contador_string = 0

    for id_script, codigo_js in dicionario_scripts.items():
        # Usa regex para encontrar strings entre aspas simples ('...') ou duplas ("...")
        # Ignora strings vazias ou muito curtas (ex: chaves de objetos, IDs curtos)
        padrao_string = re.compile(r'(["\'])(.*?)\1')
        
        novo_codigo_js = codigo_js
        mapeamento_scripts[id_script] = []

        for match in padrao_string.finditer(codigo_js):
            delimitador = match.group(1)
            conteudo = match.group(2)
            
            # Filtro de segurança: só traduz se parecer texto legível (tem espaços, não é um caminho/ID)
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({
                    'original': match.group(0), # A string completa com as aspas
                    'id': id_string,
                    'delimitador': delimitador,
                    'tipo': 'string',
                })
                contador_string += 1

        # === Extração de TEMPLATE LITERALS (crases `...`) ===
        # Template literals contêm texto em português + ${interpolacoes}
        # Extrai apenas o texto fora de ${...}, preservando interpolações
        # Usa parser que rastreia aninhamento de ${...} para NÃO quebrar
        # templates com backticks aninhados (ex: ${x ? `a` : `b`})
        for match_completo, conteudo in _extrair_template_literals(codigo_js):
            if not conteudo.strip():
                continue
            
            # Encontra todas as interpolações ${...} (com parser de aninhamento)
            interps = _extrair_interpolacoes(conteudo)
            
            # Substitui cada interpolação por um placeholder único
            texto_limpo = conteudo
            for i, interp in enumerate(interps):
                texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            
            # Verifica se tem texto traduzível (letras + fora de interpolações)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto:
                continue
            
            id_string = f"STR_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({
                'original': match_completo,
                'id': id_string,
                'delimitador': '`',
                'tipo': 'template',
                'interpolacoes': interps,
            })
            contador_string += 1

    if not strings_para_traduzir:
        print("      ↳ Nenhuma string de texto legível encontrada no JS. Mantendo original.")
        return dicionario_scripts

    print(f"      ↳ Enviando {len(strings_para_traduzir)} fragmentos de texto do JS para o DeepSeek...")

    # 2. Comunicação com o DeepSeek (Apenas as strings!)
    instrucoes_sistema = f"""
    Você é um tradutor especializado em localização de interfaces para a área da saúde/enfermagem.
    Traduza as mensagens/textos do Português para o idioma '{idioma_alvo}'.
    
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON válido. Sem explicações, sem blocos markdown (```json).
    2. As chaves do JSON (STR_0, STR_1...) DEVEM ser mantidas intactas.
    3. Traduza o valor. Mantenha eventuais pontuações finais, mas NÃO adicione aspas extras.
    4. Placeholders como __INTERP_0__, __INTERP_1__ etc DEVEM ser mantidos EXATAMENTE como estão.
       Eles representam variáveis JavaScript (${{...}}) e NÃO devem ser traduzidos ou alterados.
    5. Preserve tags HTML dentro do texto (ex: <strong>, <em>, <br>). Traduza APENAS o texto ao redor.
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
            {"role": "user", "content": json.dumps(strings_para_traduzir, ensure_ascii=False)}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # 3. Reconstrução do JavaScript
        retorno_seguro = {}
        for id_script, codigo_js in dicionario_scripts.items():
            codigo_reconstruido = codigo_js
            # Substitui as strings traduzidas de volta no código
            for item in mapeamento_scripts[id_script]:
                id_str = item['id']
                texto_traduzido = traducoes.get(id_str)
                
                if texto_traduzido:
                    if item.get('tipo') == 'template':
                        # Template literal: restaura interpolações ${...} nos placeholders
                        texto_final = texto_traduzido
                        for i, interp in enumerate(item.get('interpolacoes', [])):
                            texto_final = texto_final.replace(f'__INTERP_{i}__', interp, 1)
                        string_final = f"`{texto_final}`"
                    else:
                        # String normal: protege aspas e reconstrói
                        texto_traduzido = texto_traduzido.replace(item['delimitador'], f"\\{item['delimitador']}")
                        string_final = f"{item['delimitador']}{texto_traduzido}{item['delimitador']}"
                    
                    codigo_reconstruido = codigo_reconstruido.replace(item['original'], string_final, 1)
            
            retorno_seguro[id_script] = codigo_reconstruido
            
        return retorno_seguro

    except json.JSONDecodeError as e:
        print(f"\n❌ ERRO DE JSON DO DEEPSEEK: O modelo quebrou a formatação.")
        print(f"Resposta bruta da IA: {resultado[:300]}...")
        return dicionario_scripts
    except Exception as e:
        print(f"\n⚠️ Erro geral ao traduzir scripts com DeepSeek: {e}")
        return dicionario_scripts

def traduzir_html_com_deepl(html_preparado, idioma_alvo):
    try:
        # === 1. PROTEÇÃO CIRÚRGICA DE SCRIPTS E STYLES ===
        blocos_codigo = {}
        scripts_para_traduzir = {}
        contador = [0]
        
        padrao = re.compile(r'(<(script|style)\b[^>]*>.*?</\2>)', re.IGNORECASE | re.DOTALL)
        
        def proteger_bloco(match):
            codigo_original = match.group(1)
            tag_name = match.group(2).lower()
            
            id_bloco = f"DEEPL_BLOCK_{contador[0]}"
            contador[0] += 1
            placeholder = f'<div translate="no" id="{id_bloco}"></div>'
            
            # Se for script inline (sem src), separa num dicionário à parte para envio em LOTE
            if tag_name == 'script' and 'src=' not in codigo_original.lower():
                scripts_para_traduzir[placeholder] = codigo_original
            else:
                blocos_codigo[placeholder] = codigo_original
                
            return placeholder
            
        html_protegido = padrao.sub(proteger_bloco, html_preparado)
        
        # === 2. PROCESSAMENTO DEEPSEEK EM LOTE (BATCH) ===
        if scripts_para_traduzir:
            # Substitui as chamadas sequenciais por uma única requisição
            print(f"      \033[96m↳ Enviando lógicas Javascript em LOTE único para o DeepSeek...\033[0m")
            scripts_traduzidos = traduzir_lote_js_com_deepseek(scripts_para_traduzir, idioma_alvo)
            
            # Reintegra os scripts traduzidos no repositório geral de blocos
            blocos_codigo.update(scripts_traduzidos)
        
        # === 3. COMUNICAÇÃO COM DEEPL ===
        translator = deepl.Translator(CHAVE_API, server_url="https://api-free.deepl.com")
        
        idioma_deepl = idioma_alvo.upper()
        if idioma_deepl == "EN":
            idioma_deepl = "EN-US"
        elif idioma_deepl == "PT":
            idioma_deepl = "PT-BR"

        resultado = translator.translate_text(
            html_protegido, 
            target_lang=idioma_deepl, 
            tag_handling="html"
        )
        
        html_traduzido = resultado.text.strip()
        
        # === 4. RESTAURAÇÃO DE SCRIPTS E STYLES ===
        for placeholder, codigo_restaurado in blocos_codigo.items():
            html_traduzido = html_traduzido.replace(placeholder, codigo_restaurado)
            
        return html_traduzido
    except QuotaExceededException as e:
        print(f"\n❌ COTA EXCEDIDA (HTTP {e.http_status_code}): {e}")
        print(f"   ⚠️  Verifique seu uso em: https://www.deepl.com/pt-br/pro-account/usage")
        if _IA_DISPONIVEL:
            print(f"      \033[93m↳ Acionando tradutor IA como fallback...\033[0m")
            html_ia = _traduzir_html_via_ia(html_protegido, idioma_alvo, CHAVE_DEEPSEEK, CHAVE_OPENAI)
            if html_ia:
                for placeholder, codigo_restaurado in blocos_codigo.items():
                    html_ia = html_ia.replace(placeholder, codigo_restaurado)
                return html_ia
        return None
    except TooManyRequestsException as e:
        print(f"\n⚠️  MUITAS REQUISIÇÕES (HTTP {e.http_status_code}): {e}")
        if _IA_DISPONIVEL:
            print(f"      \033[93m↳ Acionando tradutor IA como fallback...\033[0m")
            html_ia = _traduzir_html_via_ia(html_protegido, idioma_alvo, CHAVE_DEEPSEEK, CHAVE_OPENAI)
            if html_ia:
                for placeholder, codigo_restaurado in blocos_codigo.items():
                    html_ia = html_ia.replace(placeholder, codigo_restaurado)
                return html_ia
        return None
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API do DeepL: {type(e).__name__}: {e}")
        if _IA_DISPONIVEL:
            print(f"      \033[93m↳ Acionando tradutor IA como fallback...\033[0m")
            try:
                html_ia = _traduzir_html_via_ia(html_protegido, idioma_alvo, CHAVE_DEEPSEEK, CHAVE_OPENAI)
                if html_ia:
                    for placeholder, codigo_restaurado in blocos_codigo.items():
                        html_ia = html_ia.replace(placeholder, codigo_restaurado)
                    return html_ia
            except Exception as e2:
                print(f"\n❌ Fallback IA também falhou: {type(e2).__name__}: {e2}")
        return None

if __name__ == "__main__":
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # =========================================================================
    
    arquivos_originais = ["morse.html"]
    idiomas_alvo = ["en", "es", "de", "it", "fr", "hi"] 
    
    # =========================================================================

    for arquivo_original in arquivos_originais:
        for idioma_alvo in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo_original}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma_alvo} {C_VERDE}(Destino: ./{idioma_alvo}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if os.path.exists(arquivo_original):
                print(f"{C_AZUL}[1/4]{RESET} Preparando HTML (Rotas, Canonical, Hreflang, Lang, Fontes e SEO)...")
                html_preparado = preparar_html_para_traducao_texto(arquivo_original, idioma_alvo)
                
                print(f"{C_AZUL}[2/4]{RESET} Processando APIs e traduzindo HTML...")
                html_traduzido = traduzir_html_com_deepl(html_preparado, idioma_alvo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[3/4]{RESET} Salvando arquivo na pasta do idioma...")
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
                            log_file.write(f"[{data_atual}] HTML traduzido: '{arquivo_original}' | Idioma alvo: '{idioma_alvo}' | Destino: '{caminho_saida}'\n")
                        print(f"{C_VERDE}📝 Log gerado/atualizado com sucesso em log_traducoes.txt.{RESET}")
                    except Exception as e:
                        print(f"{C_AMARELO}⚠️ Aviso: Erro ao escrever o log: {e}{RESET}")

                    print(f"\n{C_VERDE}🚀 CICLO COMPLETO FINALIZADO PARA '{arquivo_original}' EM '{idioma_alvo}'!{RESET}")
                    
                    # === INÍCIO DA PAUSA DE SEGURANÇA (RATE LIMIT) ===
                    # Verifica se este é o último idioma do último arquivo para não esperar à toa no final
                    is_last_file = (arquivo_original == arquivos_originais[-1])
                    is_last_lang = (idioma_alvo == idiomas_alvo[-1])
                    
                    if not (is_last_file and is_last_lang):
                        print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 45 segundos para evitar bloqueios da API...{RESET}")
                        time.sleep(45)
                    # === FIM DA PAUSA DE SEGURANÇA ===
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")