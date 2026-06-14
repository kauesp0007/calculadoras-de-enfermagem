import os
from PIL import Image

# 1. Configurações de Segurança e Otimização
DIRETORIOS_PERMITIDOS = ["img", ".", "biblioteca/img"] # Adicione outras pastas de imagens se necessário
EXTENSOES_SUPORTADAS = ('.webp', '.jpg', '.jpeg', '.png')
LARGURA_MAXIMA = 800 # 800px é um tamanho excelente para a web moderna, equilibrando qualidade e peso

arquivos_otimizados = 0
arquivos_ignorados = 0
bytes_poupados = 0
log_detalhado = []

print(f"Iniciando a varredura e redimensionamento de imagens (Largura Máx: {LARGURA_MAXIMA}px)...")

for diretorio in DIRETORIOS_PERMITIDOS:
    if not os.path.exists(diretorio):
        continue
        
    for raiz, _, arquivos in os.walk(diretorio):
        # Proteção: Ignorar pastas indesejadas que possam estar na raiz
        if "node_modules" in raiz or ".git" in raiz or "automacoes" in raiz:
            continue
            
        for arquivo in arquivos:
            if arquivo.lower().endswith(EXTENSOES_SUPORTADAS):
                caminho_completo = os.path.join(raiz, arquivo)
                
                try:
                    # Captura o tamanho original do ficheiro no disco
                    tamanho_original = os.path.getsize(caminho_completo)
                    
                    with Image.open(caminho_completo) as img:
                        # Guarda as dimensões originais
                        largura_original, altura_original = img.size
                        
                        # Verifica se a imagem é maior que o limite permitido
                        if largura_original > LARGURA_MAXIMA:
                            # Calcula a nova altura proporcional para não distorcer a imagem
                            proporcao = LARGURA_MAXIMA / float(largura_original)
                            nova_altura = int(float(altura_original) * float(proporcao))
                            
                            # Redimensiona utilizando o filtro LANCZOS (A mais alta qualidade disponível)
                            img_redimensionada = img.resize((LARGURA_MAXIMA, nova_altura), Image.Resampling.LANCZOS)
                            
                            # Mantém os dados EXIF intactos e otimiza a gravação
                            formato_original = img.format if img.format else "WEBP"
                            
                            # Substitui o ficheiro original pela versão otimizada
                            img_redimensionada.save(caminho_completo, format=formato_original, optimize=True, quality=85)
                            
                            # Calcula quanto poupamos
                            tamanho_novo = os.path.getsize(caminho_completo)
                            economia = tamanho_original - tamanho_novo
                            bytes_poupados += economia
                            arquivos_otimizados += 1
                            
                            economia_kb = economia / 1024
                            log_detalhado.append(f"[OTIMIZADO] {caminho_completo} | {largura_original}x{altura_original} -> {LARGURA_MAXIMA}x{nova_altura} | Poupou: {economia_kb:.2f} KB")
                        else:
                            arquivos_ignorados += 1
                
                except Exception as e:
                    log_detalhado.append(f"[ERRO] Falha ao processar {caminho_completo}: {e}")

# Converte o total poupado para Megabytes
mb_poupados = bytes_poupados / (1024 * 1024)

# Gera o Registo (Log) Detalhado
caminho_log = "log_otimizacao_imagens.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DE OTIMIZAÇÃO DE IMAGENS (SERVE SCALED)            \n")
    log.write("======================================================================\n\n")
    log.write(f"Imagens redimensionadas e otimizadas: {arquivos_otimizados}\n")
    log.write(f"Imagens que já estavam no tamanho correto: {arquivos_ignorados}\n")
    log.write(f"Total de espaço em disco e rede poupado: {mb_poupados:.2f} MB\n\n")
    log.write("Detalhamento por ficheiro:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Otimização de imagens concluída com sucesso!")
print(f"Total de espaço poupado: {mb_poupados:.2f} MB")
print(f"O log detalhado foi guardado em: {os.path.abspath(caminho_log)}")
print("==========================================")