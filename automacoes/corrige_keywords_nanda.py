import os
import re

# ==========================================
# PASSO 1: CONFIGURAÇÕES E SUPER DICIONÁRIO
# ==========================================

# 1. Escopo de Atuação restrito às 18 pastas de idiomas
PASTAS_IDIOMAS = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
]

# 2. Pastas Ignoradas para proteção do repositório
PASTAS_IGNORADAS = [
    'downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts'
]
# 3. Arquivos Ignorados: HTMLs de estrutura que NÃO devem ser alterados
ARQUIVOS_IGNORADOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

# 3. Super Dicionário de Termos NANDA (Português -> Inglês) para tradução em memória
DICIONARIO_NANDA = {
    # Termos Cardiovasculares e Respiratórios
    "choque": "shock", "perfusão": "perfusion", "débito cardíaco": "cardiac output",
    "respiração": "breathing", "ventilação": "ventilation", "gases": "gas",
    "vias aéreas": "airway", "oxigenação": "oxygenation", "oxigênio": "oxygen",
    "hipóxia": "hypoxia", "taquipneia": "tachypnea", "coração": "heart",
    "taquicardia": "tachycardia", "bradicardia": "bradycardia", "desmame": "weaning",
    "ventilatória": "ventilatory", "secreção": "secretion", "tosse": "cough",
    "hemorragia": "hemorrhage", "sangramento": "bleeding", "pressão arterial": "blood pressure",
    
    # Termos de Termorregulação e Imunidade
    "hipertermia": "hyperthermia", "hipotermia": "hypothermia", "termorregulação": "thermoregulation",
    "temperatura": "temperature", "infecção": "infection", "imunidade": "immunity",
    "leucopenia": "leukopenia", "patógeno": "pathogen",
    
    # Termos Nutricionais e Gastrointestinais
    "nutrição": "nutrition", "peso": "weight", "obesidade": "obesity",
    "gordura": "fat", "fluido": "fluid", "eletrólito": "electrolyte",
    "eletrolítico": "electrolytic", "desidratação": "dehydration", "líquidos": "liquids",
    "glicose": "glucose", "diabetes": "diabetes", "bilirrubina": "bilirubin",
    "fígado": "liver", "hepática": "hepatic", "constipação": "constipation",
    "diarreia": "diarrhea", "hipoglicemia": "hypoglycemia", "deglutição": "swallowing",
    "engolir": "swallow", "mastigação": "chewing", "fezes": "feces",
    "defecação": "defecation", "intestino": "bowel", "vômito": "vomiting",
    "náusea": "nausea",
    
    # Termos de Eliminação Urinária
    "urina": "urine", "bexiga": "bladder", "micção": "urination",
    "noctúria": "nocturia", "retenção": "retention", "incontinência": "incontinence",
    
    # Termos de Mobilidade, Atividade e Pele
    "mobilidade": "mobility", "físico": "physical", "marcha": "gait",
    "deambulação": "ambulation", "fraqueza": "weakness", "esforço": "effort",
    "movimento": "movement", "cadeira de rodas": "wheelchair", "exaustão": "exhaustion",
    "cansaço": "tiredness", "fadiga": "fatigue", "linfedema": "lymphedema",
    "edema": "edema", "linfa": "lymph", "integridade": "integrity",
    "pele": "skin", "tecido": "tissue", "ferida": "wound",
    "lesão por pressão": "pressure injury", "eritema": "erythema", "cisalhamento": "shear",
    "úlcera": "ulcer",
    
    # Termos Psicológicos, Neurológicos e Sono
    "cognição": "cognition", "confusão": "confusion", "comunicação": "communication",
    "consciência": "consciousness", "ansiedade": "anxiety", "medo": "fear",
    "sono": "sleep", "delirium": "delirium", "tédio": "boredom",
    "memória": "memory", "despertar": "awakening", "desesperança": "hopelessness",
    "depressão": "depression", "autoestima": "self-esteem", "culpa": "guilt",
    "tensão": "strain", "crença": "belief", "religião": "religion",
    "espiritual": "spiritual",
    
    # Termos Materno-Infantil e Pediátricos
    "infantil": "infant", "neonatal": "neonatal", "criança": "child",
    "bebê": "baby", "lactente": "infant", "pediátrica": "pediatric",
    "recém-nascido": "newborn", "mãe": "mother", "materna": "maternal",
    "gestante": "pregnant", "parto": "labor", "amamentação": "breastfeeding",
    "mama": "breast", "peito": "breast", "sucção": "sucking",
    "mamilo": "nipple", "asfixia": "asphyxia", "neonato": "neonate",
    
    # Termos Gerais de Saúde, Cuidados e Risco
    "desequilíbrio": "imbalance", "risco": "risk", "queda": "fall",
    "equilíbrio": "balance", "autocuidado": "self-care", "adulto": "adult",
    "idoso": "elderly", "envelhecimento": "aging", "paternidade": "parenting",
    "pais": "parents", "dor": "pain", "agudo": "acute",
    "crônico": "chronic", "débito": "output", "cardíaco": "cardiac",
    "sedentário": "sedentary", "fuga": "elopement", "frágil": "frail",
    "isolamento": "isolation", "comunidade": "community", "fumar": "smoking",
    "substâncias": "substances", "autogestão": "self-management", "sintomas": "symptoms",
    "banho": "bathing", "vestir": "dressing", "alimentar": "feeding",
    "cuidador": "caregiver"
}

print("Passo 1 concluído: Super dicionário atualizado com o leque expandido de palavras-chave.")


# ==========================================
# PASSO 2: MOTOR DE SINCRONIZAÇÃO E TRADUÇÃO (RAIZ -> IDIOMA)
# ==========================================

arquivos_alterados = 0
arquivos_nao_alterados = 0

# Expressão Regular para encontrar exatamente as declarações e as injeções (push) dos arrays
# Ela busca por let keywords = [...], let excludeWords = [...], let diagnosticosKeywords = [...] e seus respectivos .push()
padrao_linhas_nanda = re.compile(
    r"(let\s+(?:keywords|excludeWords|diagnosticosKeywords)\s*=\s*\[.*?\];|(?:keywords|excludeWords|diagnosticosKeywords)\.push\(.*?\);)",
    re.DOTALL
)

diretorio_raiz = os.getcwd()

for pasta_idioma in PASTAS_IDIOMAS:
    caminho_pasta_idioma = os.path.join(diretorio_raiz, pasta_idioma)
    if not os.path.exists(caminho_pasta_idioma):
        continue
        
    for root_dir, dirs, files in os.walk(caminho_pasta_idioma):
        # Filtro de segurança para não entrar onde não deve
        dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS]
        
        for file in files:
            if not file.endswith('.html') or file in ARQUIVOS_IGNORADOS:
                continue
                
            caminho_arquivo_idioma = os.path.join(root_dir, file)
            
            # Descobre o caminho do arquivo equivalente na RAIZ (Português)
            # Ex: se o arquivo é /ru/apache.html, o caminho raiz é /apache.html
            caminho_relativo = os.path.relpath(caminho_arquivo_idioma, caminho_pasta_idioma)
            caminho_arquivo_raiz = os.path.join(diretorio_raiz, caminho_relativo)
            
            # Se o arquivo não existir na raiz, ignora
            if not os.path.exists(caminho_arquivo_raiz):
                continue
                
            # 1. LÊ A FONTE DA VERDADE (HTML PT-BR NA RAIZ) E EXTRAI OS ARRAYS INTACTOS
            with open(caminho_arquivo_raiz, 'r', encoding='utf-8') as f_raiz:
                conteudo_pt = f_raiz.read()
                
            linhas_pt = padrao_linhas_nanda.findall(conteudo_pt)
            
            if not linhas_pt:
                # O arquivo é um HTML, mas não possui a ferramenta NANDA
                arquivos_nao_alterados += 1
                continue 
                
            # 2. TRADUZ OS ARRAYS DA RAIZ PARA O INGLÊS EM MEMÓRIA
            linhas_en = []
            for linha in linhas_pt:
                linha_traduzida = linha
                for pt_word, en_word in DICIONARIO_NANDA.items():
                    # Traduz apenas as palavras exatas que estão dentro de aspas (simples ou duplas)
                    linha_traduzida = linha_traduzida.replace(f"'{pt_word}'", f"'{en_word}'")
                    linha_traduzida = linha_traduzida.replace(f'"{pt_word}"', f'"{en_word}"')
                linhas_en.append(linha_traduzida)
                
            # 3. LÊ O ARQUIVO DO IDIOMA (ONDE OS ARRAYS ESTÃO MISTURADOS)
            with open(caminho_arquivo_idioma, 'r', encoding='utf-8') as f_idioma:
                conteudo_idioma = f_idioma.read()
                
            # Encontra exatamente onde estão as linhas bagunçadas no idioma alvo
            matches_idioma = list(padrao_linhas_nanda.finditer(conteudo_idioma))
            
            # 4. SUBSTITUI AS LINHAS SE A ESTRUTURA FOR IDÊNTICA (mesmo número de linhas capturadas)
            if len(matches_idioma) == len(linhas_en):
                novo_conteudo_idioma = conteudo_idioma
                
                # Substitui as linhas de trás para frente para não alterar as posições de memória do arquivo
                for i in reversed(range(len(matches_idioma))):
                    match = matches_idioma[i]
                    inicio, fim = match.span()
                    novo_conteudo_idioma = novo_conteudo_idioma[:inicio] + linhas_en[i] + novo_conteudo_idioma[fim:]
                    
                # 5. APROVEITA PARA TROCAR A CHAMADA DO BANCO DE DADOS (SE AINDA NÃO FOI FEITO)
                novo_conteudo_idioma = novo_conteudo_idioma.replace("'/banco_nanda.json'", "'/banco_nanda_en.json'")
                novo_conteudo_idioma = novo_conteudo_idioma.replace('"/banco_nanda.json"', '"/banco_nanda_en.json"')
                
                # 6. SALVA O ARQUIVO CORRIGIDO
                with open(caminho_arquivo_idioma, 'w', encoding='utf-8') as f_idioma_write:
                    f_idioma_write.write(novo_conteudo_idioma)
                    
                arquivos_alterados += 1
            else:
                arquivos_nao_alterados += 1

print("Passo 2 concluído: Lógica de Sincronização Raiz -> Idioma implementada.")
# ==========================================
# PASSO 3: LOG OBRIGATÓRIO DE SAÍDA
# ==========================================

print("\n=======================================================")
print("RELATÓRIO DE EXECUÇÃO: SINCRONIZAÇÃO E TRADUÇÃO NANDA")
print("=======================================================")
print(f"Arquivos que foram corrigidos e alterados: {arquivos_alterados}")
print(f"Arquivos que não precisaram ser alterados: {arquivos_nao_alterados}")
print("=======================================================")
print("Processo de correção finalizado com segurança.\n")