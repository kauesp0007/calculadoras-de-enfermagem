import os
import re

DIRETORIOS_IDIOMAS = [
    "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Dicionário inteligente com as traduções das etiquetas exigidas pelo PageSpeed
TRADUCOES_ARIA = {
    "en": {"acess": "Accessibility Policy", "sust": "Digital Sustainability", "priv": "Privacy Policy"},
    "es": {"acess": "Política de Accesibilidad", "sust": "Sostenibilidad Digital", "priv": "Política de Privacidad"},
    "fr": {"acess": "Politique d'accessibilité", "sust": "Durabilité Numérique", "priv": "Politique de Confidentialité"},
    "it": {"acess": "Politica di Accessibilità", "sust": "Sostenibilità Digitale", "priv": "Informativa sulla Privacy"},
    "de": {"acess": "Barrierefreiheitsrichtlinie", "sust": "Digitale Nachhaltigkeit", "priv": "Datenschutzrichtlinie"},
    "hi": {"acess": "पहुँच नीति", "sust": "डिजिटल स्थिरता", "priv": "गोपनीयता नीति"},
    "zh": {"acess": "无障碍政策", "sust": "数字可持续性", "priv": "隐私政策"},
    "ja": {"acess": "アクセシビリティポリシー", "sust": "デジタルサステナビリティ", "priv": "プライバシーポリシー"},
    "ru": {"acess": "Политика доступности", "sust": "Цифровая устойчивость", "priv": "Политика конфиденциальности"},
    "ko": {"acess": "접근성 정책", "sust": "디지털 지속 가능성", "priv": "개인정보 처리방침"},
    "tr": {"acess": "Erişilebilirlik Politikası", "sust": "Dijital Sürdürülebilirlik", "priv": "Gizlilik Politikası"},
    "nl": {"acess": "Toegankelijkheidsbeleid", "sust": "Digitale Duurzaamheid", "priv": "Privacybeleid"},
    "pl": {"acess": "Polityka dostępności", "sust": "Cyfrowy zrównoważony rozwój", "priv": "Polityka prywatności"},
    "sv": {"acess": "Tillgänglighetspolicy", "sust": "Digital hållbarhet", "priv": "Integritetspolicy"},
    "id": {"acess": "Kebijakan Aksesibilitas", "sust": "Keberlanjutan Digital", "priv": "Kebijakan Privasi"},
    "vi": {"acess": "Chính sách tiếp cận", "sust": "Tính bền vững kỹ thuật số", "priv": "Chính sách bảo mật"},
    "uk": {"acess": "Політика доступності", "sust": "Цифрова стійкість", "priv": "Політика конфіденційності"},
    "ar": {"acess": "سياسة إمكانية الوصول", "sust": "الاستدامة الرقمية", "priv": "سياسة الخصوصية"}
}

def injetar_aria_label(match, label_text):
    tag = match.group(0)
    if 'aria-label=' in tag:
        return re.sub(r'aria-label="[^"]*"', f'aria-label="{label_text}"', tag)
    else:
        return tag.replace('>', f' aria-label="{label_text}">')

def injetar_alt_img(match, alt_text):
    tag = match.group(0)
    if 'alt=' in tag:
        return re.sub(r'alt="[^"]*"', f'alt="{alt_text}"', tag)
    else:
        if '/>' in tag:
            return tag.replace('/>', f' alt="{alt_text}" />')
        else:
            return tag.replace('>', f' alt="{alt_text}">')

def processar_ficheiro(caminho, idioma):
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            html = f.read()
        
        original = html
        trad = TRADUCOES_ARIA.get(idioma, TRADUCOES_ARIA["en"])

        # 1. Proteção nas Hiperligações (<a>) dos Selos
        html = re.sub(r'(<a[^>]*href="[^"]*politicadeacessibilidade\.html"[^>]*>)', lambda m: injetar_aria_label(m, trad['acess']), html)
        html = re.sub(r'(<a[^>]*href="[^"]*impactodigital\.html"[^>]*>)', lambda m: injetar_aria_label(m, trad['sust']), html)
        html = re.sub(r'(<a[^>]*href="[^"]*politica\.html"[^>]*>)', lambda m: injetar_aria_label(m, trad['priv']), html)

        # 2. Proteção nas Imagens (<img>) dos Selos
        html = re.sub(r'(<img[^>]*seloacessibilidade[^>]*>)', lambda m: injetar_alt_img(m, trad['acess']), html)
        html = re.sub(r'(<img[^>]*selosustentabilidade[^>]*>)', lambda m: injetar_alt_img(m, trad['sust']), html)
        html = re.sub(r'(<img[^>]*selolgpd[^>]*>)', lambda m: injetar_alt_img(m, trad['priv']), html)

        # 3. Proteção para Redes Sociais (Marcas não se traduzem)
        redes_sociais = {"linkedin": "LinkedIn", "instagram": "Instagram", "tiktok": "TikTok", "youtube": "YouTube"}
        for rede, nome_rede in redes_sociais.items():
            html = re.sub(rf'(<a[^>]*href="[^"]*{rede}[^"]*"[^>]*>)', lambda m: injetar_aria_label(m, nome_rede), html)

        # 4. Esconder Ícones FontAwesome de Leitores de Tela (Evita ruído de voz)
        html = re.sub(r'(<i[^>]*class="[^"]*fa-[^"]*"[^>]*)(>)', lambda m: m.group(1) + ' aria-hidden="true">' if 'aria-hidden' not in m.group(1) else m.group(0), html)

        if html != original:
            with open(caminho, 'w', encoding='utf-8') as f:
                f.write(html)
            return True
        return False
        
    except Exception as e:
        print(f"[ERRO] Falha ao processar {caminho}: {e}")
        return False

# Execução Principal
alterados = 0
intactos = 0

print("==================================================")
print("INICIANDO INJEÇÃO DE ACESSIBILIDADE NOS IDIOMAS...")
print("==================================================")

for lang in DIRETORIOS_IDIOMAS:
    # Foca exclusivamente nos ficheiros footer.html das pastas estrangeiras
    caminho_footer = os.path.join(lang, "footer.html")
    if os.path.exists(caminho_footer):
        mudou = processar_ficheiro(caminho_footer, lang)
        if mudou:
            alterados += 1
            print(f"[CORRIGIDO - {lang.upper()}] {caminho_footer}")
        else:
            intactos += 1
            print(f"[OK - {lang.upper()}] {caminho_footer} (Nenhuma alteração necessária)")

print("\n==================================================")
print(f"Total de ficheiros corrigidos: {alterados}")
print(f"Total de ficheiros já intactos: {intactos}")
print("Automação de auditoria PageSpeed finalizada!")
print("==================================================")