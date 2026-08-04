"""Funções utilitárias: normalização, sanitização, hash."""

import re
import hashlib
import unicodedata
from pathlib import Path
from typing import Optional


def normalizar_nome_arquivo(texto: str) -> str:
    """Normaliza uma string para uso em nome de arquivo SEO-friendly.

    Regras aplicadas na ordem:
        1. Remove acentos e cedilha
        2. Remove caracteres especiais (mantém letras, números, ponto, hífen, underline)
        3. Substitui espaços por underline
        4. Remove underlines múltiplos consecutivos
        5. Remove underlines no início e fim
        6. Converte para minúsculas (exceto siglas maiúsculas — tratado separadamente)

    Args:
        texto: String a ser normalizada.

    Returns:
        String normalizada, pronta para compor nome de arquivo.
    """
    if not texto:
        return ""

    # 1. Decompor Unicode para separar acentos
    nfkd = unicodedata.normalize("NFKD", texto)
    # Remove diacríticos (acentos, cedilha, til, etc.)
    sem_acentos = "".join(c for c in nfkd if not unicodedata.combining(c))

    # 2. Substitui caracteres especiais comuns por equivalentes
    sem_acentos = sem_acentos.replace("ç", "c").replace("Ç", "C")
    sem_acentos = sem_acentos.replace("ñ", "n").replace("Ñ", "N")

    # 3. Remove tudo que não for letra, número, ponto, hífen, underline ou espaço
    limpo = re.sub(r"[^a-zA-Z0-9.\-_ ]", "", sem_acentos)

    # 4. Substitui espaços por underline
    com_underline = limpo.replace(" ", "_")

    # 5. Remove underlines múltiplos
    sem_duplicados = re.sub(r"_+", "_", com_underline)

    # 6. Remove underlines das bordas
    resultado = sem_duplicados.strip("_")

    # 7. Remove pontos e hífens duplicados
    resultado = re.sub(r"\.+", ".", resultado)
    resultado = re.sub(r"\-+", "-", resultado)

    # 7b. Remove hífens isolados entre underlines (ex: "abc_-_def" → "abc_def")
    resultado = re.sub(r"_-_", "_", resultado)
    # Remove hífen seguido de underline no início (ex: "-_abc" → "abc")
    resultado = re.sub(r"^\-_", "", resultado)
    # Remove underline seguido de hífen no final (ex: "abc_-" → "abc")
    resultado = re.sub(r"_\-$", "", resultado)

    # 8. Remove caracteres inválidos para Windows
    resultado = re.sub(r'[<>:"/\\|?*]', "", resultado)

    return resultado


def gerar_hash_sha256(caminho: Path) -> str:
    """Gera hash SHA-256 de um arquivo.

    Lê o arquivo em blocos de 64KB para eficiência com arquivos grandes.

    Args:
        caminho: Path para o arquivo.

    Returns:
        String hexadecimal do hash SHA-256.
    """
    sha256 = hashlib.sha256()
    with open(caminho, "rb") as f:
        while chunk := f.read(65536):  # 64 KB por bloco
            sha256.update(chunk)
    return sha256.hexdigest()


def gerar_hash_texto(texto: str) -> str:
    """Gera hash SHA-256 de uma string (usado para cache de prompts)."""
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def validar_extensao_pdf(caminho: Path) -> bool:
    """Verifica se o arquivo é um PDF (pela extensão e assinatura mágica)."""
    if caminho.suffix.lower() != ".pdf":
        return False

    # Verifica assinatura mágica do PDF (%PDF)
    try:
        with open(caminho, "rb") as f:
            header = f.read(5)
        return header == b"%PDF-"
    except (IOError, OSError):
        return False


def formatar_tamanho(bytes_val: int) -> str:
    """Formata tamanho em bytes para formato legível."""
    for unit in ("B", "KB", "MB", "GB"):
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"


def formatar_tempo(segundos: float) -> str:
    """Formata segundos para formato legível (ex: 4m 23s)."""
    if segundos < 60:
        return f"{segundos:.1f}s"
    minutos = int(segundos // 60)
    segs = segundos % 60
    if minutos < 60:
        return f"{minutos}m {segs:.0f}s"
    horas = minutos // 60
    mins = minutos % 60
    return f"{horas}h {mins}m {segs:.0f}s"


def extrair_ano(texto: str) -> Optional[int]:
    """Extrai o ano mais provável de uma string (ex: data, copyright)."""
    # Procura por anos entre 1900 e 2030
    match = re.findall(r"\b(19[0-9]{2}|20[0-2][0-9]|2030)\b", texto)
    if match:
        # Retorna o ano mais recente encontrado (geralmente o correto)
        return max(int(y) for y in match)
    return None


def detectar_sumario(texto: str) -> Optional[str]:
    """Tenta detectar sumário/índice no texto extraído.

    Procura por padrões como:
        - "Sumário", "SUMÁRIO", "Índice", "ÍNDICE"
        - Linhas com "......." seguido de número de página
        - "1. Introdução ..... 3"

    Returns:
        Trecho do sumário se encontrado, None caso contrário.
    """
    linhas = texto.split("\n")
    marcadores = [
        "sumário", "sumario", "índice", "indice", "contents",
        "table of contents", "índice geral", "sumário geral",
    ]

    for i, linha in enumerate(linhas):
        linha_lower = linha.strip().lower()
        if any(m in linha_lower for m in marcadores):
            # Coleta as próximas 30 linhas como sumário
            inicio = max(0, i)
            fim = min(len(linhas), i + 35)
            trecho = "\n".join(linhas[inicio:fim])
            # Verifica se tem padrão de sumário (pontos + número)
            if re.search(r"\.{3,}\s*\d+", trecho) or re.search(
                r"\d+\.\d*\s+\.{3,}", trecho
            ):
                return trecho

    return None
