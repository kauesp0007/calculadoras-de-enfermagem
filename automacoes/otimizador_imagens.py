import os
import re
import unicodedata
import urllib.parse
from PIL import Image

# 1. Configurações de Segurança e Otimização
DIRETORIOS_IMAGENS = ["img", ".", "biblioteca/img"] 
EXTENSOES_SUPORTADAS = ('.webp', '.jpg', '.jpeg', '.png')
LARGURA_MAXIMA = 800

# 2. Whitelist para atualizar os caminhos no HTML (18 idiomas + raiz e pastas modulares)
DIRETORIOS_HTML = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk",
    "blog", "biblioteca", "downloads", "blog-templates"
]

arquivos_otimizados = 0
arquivos_renomeados = 0
htmls_atualizados = 0
bytes_poupados = 0
log_detalhado = []

# Memória de renomeação para usar na FASE 3
mapa_renomeacoes = {} # Formato: { 'Nome Antigo.jpg': 'nome-novo-calculadoras-de-enfermagem.jpg' }

def padronizar_nome_seo(nome_arquivo):
    """
    Aplica as diretrizes rígidas do Google Imagens:
    Sem acento, sem caractere especial, letras minúsculas, hifens (traços) no lugar de espaços e sufixo de branding.
    """
    nome, ext = os.path.splitext(nome_arquivo)
    
    # 1. Se já tiver o sufixo (caso rode o script 2x), remove temporariamente para não duplicar
    nome = re.sub(r'-calculadoras-de-enfermagem$', '', nome, flags=re.IGNORECASE)
    
    # 2. Remove acentos (ex: Ícone -> Icone, Ç -> C)
    nome = unicodedata.normalize('NFKD', nome).encode('ASCII', 'ignore').decode('utf-8')
    
    # 3. Tudo em minúsculas
    nome = nome.lower()
    
    # 4. Substitui espaços, underlines e símbolos estranhos por HÍFEN / TRAÇO (Recomendação SEO Google)
    nome = re.sub(r'[^a-z0-9]+', '-', nome)
    
    # 5. Remove hifens extras duplicados ou nas pontas
    nome = nome.strip('-')
    
    # 6. Adiciona o sufixo de branding e devolve a extensão
    if nome:
        return f"{nome}-calculadoras-de-enfermagem{ext.lower()}"
    return nome_arquivo # Fallback de segurança

print("=================================================================")
print(f"FASE 1 e 2: Otimização de Peso e Renomeação SEO (Máx: {LARGURA_MAXIMA}px)")
print("=================================================================")

for diretorio in DIRETORIOS_IMAGENS:
    if not os.path.exists(diretorio):
        continue
        
    for raiz, _, arquivos in os.walk(diretorio):
        if "node_modules" in raiz or ".git" in raiz or "automacoes" in raiz:
            continue
            
        for arquivo in arquivos:
            if arquivo.lower().endswith(EXTENSOES_SUPORTADAS):
                caminho_antigo = os.path.join(raiz, arquivo)
                nome_seo_novo = padronizar_nome_seo(arquivo)
                caminho_novo = os.path.join(raiz, nome_seo_novo)
                
                # Previne sobreposição caso já exista um arquivo com o mesmo nome novo
                if os.path.exists(caminho_novo) and caminho_novo != caminho_antigo:
                    nome, ext = os.path.splitext(nome_seo_novo)
                    nome_seo_novo = f"{nome}-1{ext}"
                    caminho_novo = os.path.join(raiz, nome_seo_novo)
                
                try:
                    tamanho_original = os.path.getsize(caminho_antigo)
                    houve_redimensionamento = False
                    
                    with Image.open(caminho_antigo) as img:
                        largura, altura = img.size
                        formato = img.format if img.format else "WEBP"
                        
                        # REDIMENSIONAMENTO FÍSICO
                        if largura > LARGURA_MAXIMA:
                            proporcao = LARGURA_MAXIMA / float(largura)
                            nova_altura = int(float(altura) * float(proporcao))
                            img_red = img.resize((LARGURA_MAXIMA, nova_altura), Image.Resampling.LANCZOS)
                            
                            # Salva a versão encolhida já no nome correto
                            img_red.save(caminho_novo, format=formato, optimize=True, quality=85)
                            houve_redimensionamento = True
                            
                            economia = tamanho_original - os.path.getsize(caminho_novo)
                            bytes_poupados += economia
                            arquivos_otimizados += 1
                            log_detalhado.append(f"[REDIMENSIONOU] {arquivo} -> Reduzido para {LARGURA_MAXIMA}x{nova_altura} (-{economia/1024:.1f} KB)")
                    
                    # LOGICA DE GRAVAÇÃO NO DISCO E MUDANÇA DE NOME
                    if nome_seo_novo != arquivo:
                        if houve_redimensionamento:
                            # Se redimensionou e gravou no caminho novo, podemos apagar a original pesada
                            os.remove(caminho_antigo)
                        else:
                            # Se não precisava encolher, apenas renomeia a foto na pasta
                            os.rename(caminho_antigo, caminho_novo)
                            
                        mapa_renomeacoes[arquivo] = nome_seo_novo
                        arquivos_renomeados += 1
                        log_detalhado.append(f"[SEO RENAME] {arquivo} -> {nome_seo_novo}")
                        
                except Exception as e:
                    log_detalhado.append(f"[ERRO] Falha ao processar {caminho_antigo}: {e}")

print("\n=================================================================")
print("FASE 3: Varredura de HTML e Atualização Global de Caminhos")
print("=================================================================")

# Só realiza a varredura se alguma foto tiver mudado de nome
if mapa_renomeacoes:
    for dir_html in DIRETORIOS_HTML:
        if not os.path.exists(dir_html):
            continue
            
        for arquivo in os.listdir(dir_html):
            # Escaneia HTMLs, Templates e o JSON da sua biblioteca
            if arquivo.endswith(('.html', '.json', '.js')):
                caminho_arquivo = os.path.join(dir_html, arquivo)
                
                if not os.path.isfile(caminho_arquivo):
                    continue
                    
                try:
                    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                        conteudo_original = f.read()
                        
                    conteudo_novo = conteudo_original
                    
                    # Procura pelos nomes antigos no texto e substitui
                    for nome_antigo, nome_novo in mapa_renomeacoes.items():
                        # O HTML pode conter a string exata com espaços ou encodada em %20
                        nome_antigo_url = urllib.parse.quote(nome_antigo)
                        
                        if nome_antigo in conteudo_novo:
                            conteudo_novo = conteudo_novo.replace(nome_antigo, nome_novo)
                            
                        if nome_antigo_url in conteudo_novo and nome_antigo_url != nome_antigo:
                            conteudo_novo = conteudo_novo.replace(nome_antigo_url, nome_novo)
                            
                    # Salva o arquivo apenas se tiver detectado mudanças (evita I/O desnecessário)
                    if conteudo_novo != conteudo_original:
                        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
                            f.write(conteudo_novo)
                        htmls_atualizados += 1
                        log_detalhado.append(f"[HTML UPDATE] Atualizou referências em: {caminho_arquivo}")
                        
                except Exception as e:
                    log_detalhado.append(f"[ERRO] Falha ao atualizar {caminho_arquivo}: {e}")
else:
    print("Nenhuma imagem precisou ser renomeada. Varredura ignorada.")

# GERAÇÃO DO RELATÓRIO FINAL
mb_poupados = bytes_poupados / (1024 * 1024)
caminho_log = "log_otimizacao_imagens_seo.txt"

with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("      RELATÓRIO DE OTIMIZAÇÃO (PAGE SPEED + GOOGLE IMAGES SEO)        \n")
    log.write("======================================================================\n\n")
    log.write(f"Imagens redimensionadas (Economia de banda): {arquivos_otimizados}\n")
    log.write(f"Espaço total poupado: {mb_poupados:.2f} MB\n")
    log.write(f"Imagens renomeadas para o padrão SEO: {arquivos_renomeados}\n")
    log.write(f"Ficheiros do sistema (HTML/JS) atualizados com segurança: {htmls_atualizados}\n\n")
    log.write("Detalhamento por evento:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("PROCESSO GLOBAL CONCLUÍDO!")
print(f"Banda poupada: {mb_poupados:.2f} MB")
print(f"Ficheiros de sistema reescritos para evitar links quebrados: {htmls_atualizados}")
print(f"Log detalhado gerado em: {os.path.abspath(caminho_log)}")
print("==========================================")