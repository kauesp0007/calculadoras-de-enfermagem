"""Result term manager — Etapa 4 (pós-tradução).

Substitui DETERMINISTICAMENTE termos de resultado que a IA de tradução
costuma deixar em português (acidose, alcalose, normal, elevado, compensação,
hipoxemia, etc.) — válidos para calculadoras/escalas de interpretação.

Match case-insensitive; preserva CAIXA ALTA quando o original está todo em
maiúsculas (ex.: "ACIDOSE" → "ACIDOSIS").

É o contraponto determinístico do glossário: enquanto o glossário apenas
SUGERE termos à IA, este manager APLICA a tradução direto no HTML final.
"""

import re

from automacoes.translation import config

# Termos comuns de resultado (pt-BR, minúsculo p/ match case-insensitive)
# -> tradução por idioma (forma canônica em caixa baixa/título).
TERMOS_RESULTADO = {
    # --- Equilíbrio ácido-base ---
    "acidose": {"en": "acidosis", "es": "acidosis", "fr": "acidose", "it": "acidosi",
        "de": "Azidose", "hi": "अम्लरक्तता", "zh": "酸中毒", "ja": "アシドーシス",
        "ru": "ацидоз", "ko": "산증", "tr": "asidoz", "nl": "acidose", "pl": "kwasica",
        "sv": "acidos", "id": "asidosis", "vi": "toan máu", "uk": "ацидоз", "ar": "الحماض"},
    "alcalose": {"en": "alkalosis", "es": "alcalosis", "fr": "alcalose", "it": "alcalosi",
        "de": "Alkalose", "hi": "क्षाररक्तता", "zh": "碱中毒", "ja": "アルカローシス",
        "ru": "алкалоз", "ko": "알칼리증", "tr": "alkaloz", "nl": "alkalose", "pl": "zasadowica",
        "sv": "alkalos", "id": "alkalosis", "vi": "nhiễm kiềm", "uk": "алкалоз", "ar": "القلاء"},
    "acidemia": {"en": "Acidemia", "es": "Acidemia", "fr": "Acidémie", "it": "Acidemia",
        "de": "Azidämie", "hi": "अम्लरक्तता", "zh": "酸血症", "ja": "酸血症",
        "ru": "Ацидемия", "ko": "산혈증", "tr": "Asidemi", "nl": "Acidemie", "pl": "Kwasica",
        "sv": "Acidemi", "id": "Asidemia", "vi": "Nhiễm toan máu", "uk": "Ацидемія", "ar": "حماض الدم"},
    "alcalemia": {"en": "Alkalemia", "es": "Alcalemia", "fr": "Alcalémie", "it": "Alcalemia",
        "de": "Alkalämie", "hi": "क्षाररक्तता", "zh": "碱血症", "ja": "アルカリ血症",
        "ru": "Алкалемия", "ko": "알칼리혈증", "tr": "Alkalemi", "nl": "Alkalemie", "pl": "Zasadowica",
        "sv": "Alkalemi", "id": "Alkalemia", "vi": "Nhiễm kiềm máu", "uk": "Алкалемія", "ar": "قلاء الدم"},
    # --- Compensação ---
    "compensada": {"en": "compensated", "es": "compensada", "fr": "compensée", "it": "compensata",
        "de": "kompensiert", "hi": "क्षतिपूरित", "zh": "代偿", "ja": "代償",
        "ru": "компенсирован", "ko": "보상됨", "tr": "kompanse", "nl": "gecompenseerd",
        "pl": "skompensowane", "sv": "kompenserad", "id": "terkompensasi", "vi": "đã bù trừ",
        "uk": "компенсовано", "ar": "معوّض"},
    "sem compensação": {"en": "uncompensated", "es": "sin compensación", "fr": "non compensée",
        "it": "senza compensazione", "de": "unkompensiert", "hi": "अक्षतिपूरित", "zh": "未代偿",
        "ja": "非代償", "ru": "без компенсации", "ko": "비보상", "tr": "kompanse edilmemiş",
        "nl": "niet gecompenseerd", "pl": "niewyrównana", "sv": "okompenserad",
        "id": "tidak terkompensasi", "vi": "chưa bù trừ", "uk": "без компенсації", "ar": "غير معوّض"},
    "parcialmente compensada": {"en": "partially compensated", "es": "parcialmente compensada",
        "fr": "partiellement compensée", "it": "parzialmente compensata", "de": "teilkompensiert",
        "hi": "आंशिक रूप से क्षतिपूरित", "zh": "部分代偿", "ja": "部分代償", "ru": "частично компенсирован",
        "ko": "부분 보상", "tr": "kısmen kompanse", "nl": "gedeeltelijk gecompenseerd",
        "pl": "częściowo wyrównana", "sv": "delvis kompenserad", "id": "terkompensasi sebagian",
        "vi": "bù trừ một phần", "uk": "частково компенсовано", "ar": "معوّض جزئياً"},
    "totalmente compensada": {"en": "fully compensated", "es": "totalmente compensada",
        "fr": "totalement compensée", "it": "totalmente compensata", "de": "vollständig kompensiert",
        "hi": "पूर्णतः क्षतिपूरित", "zh": "完全代偿", "ja": "完全代償", "ru": "полностью компенсирован",
        "ko": "완전 보상", "tr": "tamamen kompanse", "nl": "volledig gecompenseerd",
        "pl": "w pełni wyrównana", "sv": "fullständigt kompenserad", "id": "terkompensasi penuh",
        "vi": "bù trừ hoàn toàn", "uk": "повністю компенсовано", "ar": "معوّض بالكامل"},
    "equilíbrio estável": {"en": "stable balance", "es": "equilibrio estable", "fr": "équilibre stable",
        "it": "equilibrio stabile", "de": "stabiles Gleichgewicht", "hi": "स्थिर संतुलन",
        "zh": "稳定平衡", "ja": "安定した平衡", "ru": "стабильное равновесие", "ko": "안정된 균형",
        "tr": "istikrarlı denge", "nl": "stabiel evenwicht", "pl": "stabilna równowaga",
        "sv": "stabil balans", "id": "keseimbangan stabil", "vi": "cân bằng ổn định",
        "uk": "стабільна рівновага", "ar": "توازن مستقر"},
    # --- Oxigenação ---
    "hipoxemia": {"en": "Hypoxemia", "es": "Hipoxemia", "fr": "Hypoxémie", "it": "Ipossiemia",
        "de": "Hypoxämie", "hi": "हाइपोक्सिमिया", "zh": "低氧血症", "ja": "低酸素血症",
        "ru": "Гипоксемия", "ko": "저산소혈증", "tr": "Hipoksemi", "nl": "Hypoxemie",
        "pl": "Hipoksemia", "sv": "Hypoxemi", "id": "Hipoksemia", "vi": "Giảm oxy máu",
        "uk": "Гіпоксемія", "ar": "نقص تأكسج الدم"},
    "normoxemia": {"en": "Normoxemia", "es": "Normoxemia", "fr": "Normoxémie", "it": "Normossiemia",
        "de": "Normoxämie", "hi": "सामान्य ऑक्सीजन", "zh": "血氧正常", "ja": "正常酸素血症",
        "ru": "Нормоксемия", "ko": "정상 산소혈증", "tr": "Normoksemi", "nl": "Normoxemie",
        "pl": "Normoksemia", "sv": "Normoxemi", "id": "Normoksemia", "vi": "Oxy máu bình thường",
        "uk": "Нормоксемія", "ar": "تأكسج طبيعي"},
    "hipóxia": {"en": "hypoxia", "es": "hipoxia", "fr": "hypoxie", "it": "ipossia",
        "de": "Hypoxie", "hi": "हाइपोक्सिया", "zh": "缺氧", "ja": "低酸素",
        "ru": "гипоксия", "ko": "저산소증", "tr": "hipoksi", "nl": "hypoxie",
        "pl": "hipoksja", "sv": "hypoxi", "id": "hipoksia", "vi": "thiếu oxy",
        "uk": "гіпоксія", "ar": "نقص الأكسجة"},
    # --- Severidade / qualificadores ---
    "grave": {"en": "severe", "es": "grave", "fr": "sévère", "it": "grave", "de": "schwer",
        "hi": "गंभीर", "zh": "严重", "ja": "重症", "ru": "тяжёлая", "ko": "중증",
        "tr": "şiddetli", "nl": "ernstig", "pl": "ciężka", "sv": "svår", "id": "berat",
        "vi": "nặng", "uk": "тяжка", "ar": "شديد"},
    "leve": {"en": "mild", "es": "leve", "fr": "légère", "it": "lieve", "de": "leicht",
        "hi": "हल्का", "zh": "轻度", "ja": "軽度", "ru": "лёгкая", "ko": "경증",
        "tr": "hafif", "nl": "mild", "pl": "łagodna", "sv": "lindrig", "id": "ringan",
        "vi": "nhẹ", "uk": "легка", "ar": "خفيف"},
    "elevado": {"en": "elevated", "es": "elevado", "fr": "élevé", "it": "elevato",
        "de": "erhöht", "hi": "बढ़ा हुआ", "zh": "升高", "ja": "上昇", "ru": "повышен",
        "ko": "상승", "tr": "yüksek", "nl": "verhoogd", "pl": "podwyższony", "sv": "förhöjt",
        "id": "meningkat", "vi": "tăng", "uk": "підвищений", "ar": "مرتفع"},
    "anemia": {"en": "anemia", "es": "anemia", "fr": "anémie", "it": "anemia",
        "de": "Anämie", "hi": "रक्ताल्पता", "zh": "贫血", "ja": "貧血", "ru": "анемия",
        "ko": "빈혈", "tr": "anemi", "nl": "anemie", "pl": "anemia", "sv": "anemi",
        "id": "anemia", "vi": "thiếu máu", "uk": "анемія", "ar": "فقر الدم"},
    "normal": {"en": "normal", "es": "normal", "fr": "normal", "it": "normale",
        "de": "normal", "hi": "सामान्य", "zh": "正常", "ja": "正常", "ru": "норма",
        "ko": "정상", "tr": "normal", "nl": "normaal", "pl": "prawidłowy", "sv": "normalt",
        "id": "normal", "vi": "bình thường", "uk": "норма", "ar": "طبيعي"},
    # --- Qualificadores de via/distúrbio ---
    "respiratória": {"en": "respiratory", "es": "respiratoria", "fr": "respiratoire",
        "it": "respiratoria", "de": "respiratorisch", "hi": "श्वसन", "zh": "呼吸性",
        "ja": "呼吸性", "ru": "респираторный", "ko": "호흡성", "tr": "solunumsal",
        "nl": "respiratoir", "pl": "oddechowa", "sv": "respiratorisk", "id": "respiratorik",
        "vi": "hô hấp", "uk": "респіраторний", "ar": "تنفسي"},
    "metabólica": {"en": "metabolic", "es": "metabólica", "fr": "métabolique", "it": "metabolica",
        "de": "metabolisch", "hi": "उपापचयी", "zh": "代谢性", "ja": "代謝性", "ru": "метаболический",
        "ko": "대사성", "tr": "metabolik", "nl": "metabool", "pl": "metaboliczna",
        "sv": "metabolisk", "id": "metabolik", "vi": "chuyển hóa", "uk": "метаболічний", "ar": "استقلابي"},
    "mista": {"en": "mixed", "es": "mixta", "fr": "mixte", "it": "mista", "de": "gemischt",
        "hi": "मिश्रित", "zh": "混合", "ja": "混合", "ru": "смешанная", "ko": "혼합",
        "tr": "karışık", "nl": "gemengd", "pl": "mieszana", "sv": "blandad", "id": "campuran",
        "vi": "hỗn hợp", "uk": "змішана", "ar": "مختلط"},
    "primário": {"en": "primary", "es": "primario", "fr": "primaire", "it": "primario",
        "de": "primär", "hi": "प्राथमिक", "zh": "原发性", "ja": "一次性", "ru": "первичный",
        "ko": "일차성", "tr": "birincil", "nl": "primair", "pl": "pierwotna", "sv": "primär",
        "id": "primer", "vi": "nguyên phát", "uk": "первинний", "ar": "أوّلي"},
    # --- Positivo/negativo (triagens/escalas) ---
    "positivo": {"en": "positive", "es": "positivo", "fr": "positif", "it": "positivo",
        "de": "positiv", "hi": "धनात्मक", "zh": "阳性", "ja": "陽性", "ru": "положительный",
        "ko": "양성", "tr": "pozitif", "nl": "positief", "pl": "dodatni", "sv": "positivt",
        "id": "positif", "vi": "dương tính", "uk": "позитивний", "ar": "إيجابي"},
    "negativo": {"en": "negative", "es": "negativo", "fr": "négatif", "it": "negativo",
        "de": "negativ", "hi": "ऋणात्मक", "zh": "阴性", "ja": "陰性", "ru": "отрицательный",
        "ko": "음성", "tr": "negatif", "nl": "negatief", "pl": "ujemny", "sv": "negativt",
        "id": "negatif", "vi": "âm tính", "uk": "негативний", "ar": "سلبي"},
}


def _traduzir_termo(termo_pt, idioma_destino):
    mapa = TERMOS_RESULTADO.get(termo_pt.lower())
    if not mapa:
        return None
    return mapa.get(idioma_destino)


def _preservar_caixa(original, traduzido):
    """Se o original está TODO em maiúsculas, devolve a tradução em maiúsculas."""
    if original == original.upper() and any(c.isalpha() for c in original):
        return traduzido.upper()
    return traduzido


def aplicar(html, idioma_destino):
    """Substitui termos de resultado (case-insensitive) pelo idioma alvo."""
    if idioma_destino not in config.IDIOMAS_SUPORTADOS:
        return html

    for termo_pt in TERMOS_RESULTADO:
        traducao = _traduzir_termo(termo_pt, idioma_destino)
        if not traducao:
            continue
        # Match case-insensitive por palavra, preservando caixa alta.
        padrao = re.compile(re.escape(termo_pt), re.IGNORECASE)

        def _sub(m):
            return _preservar_caixa(m.group(0), traducao)

        html = padrao.sub(_sub, html)

    return html
