import argparse
import base64
import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import zipfile
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

from PIL import Image, ImageOps, UnidentifiedImageError


RAIZ_PROJETO = Path(__file__).resolve().parent.parent
PASTA_ADMISSAO = RAIZ_PROJETO / "admissao_file"
PASTA_DOCUMENTOS = RAIZ_PROJETO / "docs"
PASTA_VIDEOS = RAIZ_PROJETO / "videos"
PASTA_IMAGENS = RAIZ_PROJETO / "img"
PASTA_LOGS = RAIZ_PROJETO / "logs"
AUTOMACAO_BIBLIOTECA = RAIZ_PROJETO / "biblioteca-automation.js"

MODELO_OPENAI = os.getenv("OPENAI_ADMISSION_MODEL", "gpt-4.1-mini")
QUALIDADE_WEBP = 90
LIMITE_TITULO = 100
LIMITE_TEXTO_DOCUMENTO = 4_000
NOME_GENERICO = re.compile(
    r"^(arquivo|documento|doc|imagem|image|img|foto|photo|video|vid|scan|"
    r"captura|screenshot|whatsapp|dsc|pxl|mvimg)[-_\s]*\d*$",
    re.IGNORECASE,
)

EXTENSOES_IMAGEM = {
    ".avif", ".bmp", ".dib", ".gif", ".heic", ".heif", ".jfif",
    ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp",
}
EXTENSOES_VIDEO = {
    ".3gp", ".avi", ".flv", ".m2ts", ".m4v", ".mkv", ".mov",
    ".mp4", ".mpeg", ".mpg", ".mts", ".ogv", ".webm", ".wmv",
}
EXTENSOES_DOCUMENTO = {
    ".csv", ".doc", ".docx", ".epub", ".htm", ".html", ".json",
    ".md", ".odp", ".ods", ".odt", ".pdf", ".ppt", ".pptx",
    ".rtf", ".tex", ".tsv", ".txt", ".xls", ".xlsx", ".xml",
}


class ExtratorHTML(HTMLParser):
    """Extrai título e primeiro cabeçalho de um documento HTML."""

    def __init__(self) -> None:
        super().__init__()
        self.titulo = ""
        self.cabecalho = ""
        self._tag_atual = ""

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if tag in {"title", "h1"}:
            self._tag_atual = tag

    def handle_endtag(self, tag: str) -> None:
        if tag == self._tag_atual:
            self._tag_atual = ""

    def handle_data(self, data: str) -> None:
        texto = normalizar_espacos(data)

        if not texto:
            return

        if self._tag_atual == "title" and not self.titulo:
            self.titulo = texto
        elif self._tag_atual == "h1" and not self.cabecalho:
            self.cabecalho = texto


def configurar_logger() -> logging.Logger:
    """Configura logs em arquivo e console para a automação de admissão."""

    PASTA_LOGS.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("ADMISSAO_ARQUIVOS")

    if logger.handlers:
        return logger

    formato = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    arquivo_log = PASTA_LOGS / f"{datetime.now():%Y-%m-%d}.log"
    manipulador_arquivo = logging.FileHandler(arquivo_log, encoding="utf-8")
    manipulador_console = logging.StreamHandler()
    manipulador_arquivo.setFormatter(formato)
    manipulador_console.setFormatter(formato)
    logger.addHandler(manipulador_arquivo)
    logger.addHandler(manipulador_console)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


def normalizar_espacos(texto: str) -> str:
    """Remove espaços repetidos e caracteres de controle de um texto."""

    return re.sub(r"\s+", " ", texto).strip()


def slugify(texto: str) -> str:
    """Converte texto para o padrão SEO com minúsculas e hífens."""

    texto_normalizado = unicodedata.normalize("NFKD", texto)
    texto_ascii = texto_normalizado.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", texto_ascii.lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug)


def limpar_titulo(texto: str) -> str:
    """Limpa um título extraído antes de compor o nome final."""

    texto = Path(texto).stem if len(texto) < 240 else texto
    texto = re.sub(r"[_-]+", " ", texto)
    texto = re.sub(
        r"\b(copy|copia|final|novo|nova|versao|version)\s*\d*\b",
        " ",
        texto,
        flags=re.IGNORECASE,
    )
    return normalizar_espacos(texto)[:LIMITE_TITULO]


def nome_compreensivel(texto: str) -> bool:
    """Informa se um texto contém assunto suficiente para nomear o arquivo."""

    titulo = limpar_titulo(texto)

    if not titulo or NOME_GENERICO.fullmatch(titulo):
        return False

    palavras = re.findall(r"[A-Za-zÀ-ÿ]{3,}", titulo)
    return len(palavras) >= 2 or (len(palavras) == 1 and len(palavras[0]) >= 6)


def nome_esta_em_conformidade(arquivo: Path) -> bool:
    """Valida se o nome já atende ao padrão web; o ano é opcional."""

    nome = arquivo.stem

    if arquivo.suffix != arquivo.suffix.lower():
        return False

    if not re.fullmatch(r"[a-z0-9]+(?:[-_][a-z0-9]+)*", nome):
        return False

    partes = [parte for parte in re.split(r"[-_]", nome) if parte]
    partes_textuais = [
        parte
        for parte in partes
        if not re.fullmatch(r"(?:19|20)\d{2}", parte)
        and parte not in {"documento", "imagem", "video"}
    ]
    return len(partes_textuais) >= 3 and nome_compreensivel(" ".join(partes_textuais))


def ler_texto(arquivo: Path, limite: int = LIMITE_TEXTO_DOCUMENTO) -> str:
    """Lê com tolerância o início de um arquivo textual."""

    dados = arquivo.read_bytes()[: limite * 4]

    for codificacao in ("utf-8-sig", "utf-16", "cp1252", "latin-1"):
        try:
            return dados.decode(codificacao)[:limite]
        except UnicodeDecodeError:
            continue

    return ""


def primeiro_titulo_textual(texto: str) -> str:
    """Seleciona a primeira linha textual útil de um documento."""

    for linha in texto.splitlines():
        candidata = normalizar_espacos(linha.lstrip("#>*-0123456789. "))

        if nome_compreensivel(candidata):
            return candidata[:LIMITE_TITULO]

    return ""


def ler_xml_zip(arquivo: Path, membro: str) -> str:
    """Lê texto XML de um membro presente em um documento compactado."""

    with zipfile.ZipFile(arquivo) as pacote:
        if membro not in pacote.namelist():
            return ""
        raiz = ElementTree.fromstring(pacote.read(membro))
    return normalizar_espacos(" ".join(raiz.itertext()))


def metadados_office(arquivo: Path) -> dict[str, str]:
    """Extrai título, autor e texto inicial de DOCX, XLSX e PPTX."""

    dados = {"titulo": "", "autor": "", "texto": ""}

    try:
        with zipfile.ZipFile(arquivo) as pacote:
            nomes = set(pacote.namelist())

            if "docProps/core.xml" in nomes:
                raiz = ElementTree.fromstring(pacote.read("docProps/core.xml"))

                for elemento in raiz.iter():
                    tag = elemento.tag.rsplit("}", 1)[-1]
                    valor = normalizar_espacos(elemento.text or "")

                    if tag == "title" and valor:
                        dados["titulo"] = valor
                    elif tag == "creator" and valor:
                        dados["autor"] = valor

            candidatos = []

            if arquivo.suffix.lower() == ".docx":
                candidatos = ["word/document.xml"]
            elif arquivo.suffix.lower() == ".xlsx":
                candidatos = ["xl/sharedStrings.xml"]
            elif arquivo.suffix.lower() == ".pptx":
                candidatos = sorted(
                    nome for nome in nomes
                    if re.fullmatch(r"ppt/slides/slide\d+\.xml", nome)
                )[:2]

            textos = []

            for membro in candidatos:
                if membro in nomes:
                    raiz = ElementTree.fromstring(pacote.read(membro))
                    textos.append(" ".join(raiz.itertext()))

            dados["texto"] = normalizar_espacos(" ".join(textos))[
                :LIMITE_TEXTO_DOCUMENTO
            ]
    except (OSError, zipfile.BadZipFile, ElementTree.ParseError):
        return dados

    return dados


def metadados_pdf(arquivo: Path) -> dict[str, str]:
    """Extrai metadados e o começo do texto de PDF quando há leitor disponível."""

    dados = {"titulo": "", "autor": "", "texto": ""}

    try:
        try:
            from pypdf import PdfReader
        except ImportError:
            from PyPDF2 import PdfReader

        leitor = PdfReader(str(arquivo))
        metadados = leitor.metadata or {}
        dados["titulo"] = normalizar_espacos(str(metadados.get("/Title", "")))
        dados["autor"] = normalizar_espacos(str(metadados.get("/Author", "")))

        if leitor.pages:
            dados["texto"] = normalizar_espacos(
                leitor.pages[0].extract_text() or ""
            )[:LIMITE_TEXTO_DOCUMENTO]
    except (ImportError, OSError, ValueError):
        pass

    return dados


def metadados_imagem(arquivo: Path) -> dict[str, str]:
    """Extrai título, descrição, autor e ano dos metadados de uma imagem."""

    dados = {"titulo": "", "autor": "", "ano": "", "texto": ""}

    try:
        with Image.open(arquivo) as imagem:
            exif = imagem.getexif()
            titulo = exif.get(270, "") or imagem.info.get("Description", "")
            autor = exif.get(315, "") or imagem.info.get("Author", "")
            data = str(exif.get(36867, "") or exif.get(306, ""))
            dados["titulo"] = normalizar_espacos(str(titulo))
            dados["autor"] = normalizar_espacos(str(autor))

            correspondencia = re.search(r"\b(19|20)\d{2}\b", data)

            if correspondencia:
                dados["ano"] = correspondencia.group(0)
    except (OSError, UnidentifiedImageError):
        pass

    return dados


def analisar_documento_local(arquivo: Path) -> dict[str, str]:
    """Extrai título, autor e trecho inicial conforme o formato do documento."""

    extensao = arquivo.suffix.lower()
    dados = {"titulo": "", "autor": "", "ano": "", "texto": ""}

    if extensao in {".docx", ".xlsx", ".pptx"}:
        dados.update(metadados_office(arquivo))
    elif extensao == ".pdf":
        dados.update(metadados_pdf(arquivo))
    elif extensao in {".html", ".htm"}:
        texto = ler_texto(arquivo)
        extrator = ExtratorHTML()
        extrator.feed(texto)
        dados["titulo"] = extrator.titulo or extrator.cabecalho
        dados["texto"] = re.sub(r"<[^>]+>", " ", texto)
    elif extensao in {
        ".csv", ".json", ".md", ".rtf", ".tex", ".tsv", ".txt", ".xml",
    }:
        dados["texto"] = ler_texto(arquivo)

    if not dados["titulo"] and dados["texto"]:
        dados["titulo"] = primeiro_titulo_textual(dados["texto"])

    return dados


def codificar_imagem(arquivo: Path) -> str:
    """Codifica uma imagem em URL de dados para análise opcional pela OpenAI."""

    tipo = "jpeg" if arquivo.suffix.lower() in {".jpg", ".jpeg", ".jfif"} else "png"
    conteudo = base64.b64encode(arquivo.read_bytes()).decode("ascii")
    return f"data:image/{tipo};base64,{conteudo}"


def analisar_com_openai(
    arquivo: Path,
    categoria: str,
    texto: str,
    logger: logging.Logger,
) -> dict[str, str]:
    """Solicita à OpenAI metadados curtos quando a análise local é insuficiente."""

    if not os.getenv("OPENAI_API_KEY"):
        return {}

    try:
        from openai import OpenAI

        cliente = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        instrucao = (
            "Identifique o assunto principal deste arquivo para criar nome SEO. "
            "Não invente autor, região nem ano. Responda somente JSON com as "
            "strings titulo, autor, regiao e ano. Título curto, específico e em "
            "português. Use string vazia quando não houver evidência."
        )
        conteudo: list[dict[str, Any]] = [
            {"type": "input_text", "text": f"{instrucao}\nCategoria: {categoria}"}
        ]

        if categoria == "imagem" and arquivo.suffix.lower() not in {".heic", ".heif"}:
            conteudo.append(
                {"type": "input_image", "image_url": codificar_imagem(arquivo)}
            )
        elif texto:
            conteudo[0]["text"] += f"\nInício do conteúdo:\n{texto[:LIMITE_TEXTO_DOCUMENTO]}"
        else:
            return {}

        resposta = cliente.responses.create(
            model=MODELO_OPENAI,
            input=[{"role": "user", "content": conteudo}],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "metadados_arquivo",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "titulo": {"type": "string"},
                            "autor": {"type": "string"},
                            "regiao": {"type": "string"},
                            "ano": {"type": "string"},
                        },
                        "required": ["titulo", "autor", "regiao", "ano"],
                        "additionalProperties": False,
                    },
                }
            },
        )
        dados = json.loads(resposta.output_text)
        logger.info("IA utilizada para identificar: %s", arquivo.name)
        return {
            chave: normalizar_espacos(str(dados.get(chave, "")))
            for chave in ("titulo", "autor", "regiao", "ano")
        }
    except Exception as erro:
        logger.warning(
            "IA indisponível para %s: %s: %s",
            arquivo.name,
            type(erro).__name__,
            erro,
        )
        return {}


def classificar_arquivo(arquivo: Path) -> str:
    """Classifica um arquivo como imagem, vídeo, documento ou não suportado."""

    extensao = arquivo.suffix.lower()

    if extensao in EXTENSOES_IMAGEM:
        return "imagem"
    if extensao in EXTENSOES_VIDEO:
        return "video"
    if extensao in EXTENSOES_DOCUMENTO:
        return "documento"
    return "nao-suportado"


def obter_metadados(
    arquivo: Path,
    categoria: str,
    usar_ia: bool,
    logger: logging.Logger,
) -> dict[str, str]:
    """Obtém metadados locais e complementa com IA quando necessário."""

    dados = {"titulo": "", "autor": "", "regiao": "", "ano": "", "texto": ""}

    if categoria == "imagem":
        dados.update(metadados_imagem(arquivo))
    elif categoria == "documento":
        dados.update(analisar_documento_local(arquivo))

    titulo_nome = limpar_titulo(arquivo.stem)

    if not nome_compreensivel(dados["titulo"]) and nome_compreensivel(titulo_nome):
        dados["titulo"] = titulo_nome

    if usar_ia and not nome_compreensivel(dados["titulo"]):
        dados.update(
            analisar_com_openai(arquivo, categoria, dados["texto"], logger)
        )

    if not nome_compreensivel(dados["titulo"]):
        titulo_original = normalizar_espacos(arquivo.stem)

        if slugify(titulo_original):
            dados["titulo"] = titulo_original
            logger.info(
                "Conteúdo sem título conclusivo; usando nome original sanitizado: %s",
                arquivo.name,
            )
        else:
            resumo = hashlib.sha256(arquivo.read_bytes()).hexdigest()[:10]
            dados["titulo"] = f"arquivo {resumo}"
            logger.warning(
                "Nome original sem caracteres utilizáveis; usando identificador: %s",
                arquivo.name,
            )

    correspondencia_ano = re.search(r"\b(19|20)\d{2}\b", arquivo.stem)

    if not dados["ano"] and correspondencia_ano:
        dados["ano"] = correspondencia_ano.group(0)

    return dados


def montar_nome_base(categoria: str, dados: dict[str, str]) -> str:
    """Monta o nome único no padrão categoria-assunto-autor-região-ano."""

    partes = [categoria, dados["titulo"]]

    for chave in ("autor", "regiao", "ano"):
        valor = dados.get(chave, "")

        if valor and valor not in partes:
            partes.append(valor)

    return slugify("-".join(partes))[:180].strip("-")


def destino_disponivel(pasta: Path, base: str, extensao: str) -> Path:
    """Retorna um destino livre sem sobrescrever arquivos existentes."""

    candidato = pasta / f"{base}{extensao}"
    contador = 2

    while candidato.exists():
        candidato = pasta / f"{base}-{contador}{extensao}"
        contador += 1

    return candidato


def converter_para_webp(origem: Path, destino: Path) -> None:
    """Converte uma imagem para WEBP, preservando transparência quando possível."""

    try:
        with Image.open(origem) as imagem_original:
            imagem = ImageOps.exif_transpose(imagem_original)

            if getattr(imagem, "is_animated", False):
                imagem.seek(0)

            possui_alpha = imagem.mode in {"RGBA", "LA"} or (
                imagem.mode == "P" and "transparency" in imagem.info
            )
            imagem = imagem.convert("RGBA" if possui_alpha else "RGB")
            imagem.save(
                destino,
                format="WEBP",
                quality=QUALIDADE_WEBP,
                method=6,
            )
    except (OSError, UnidentifiedImageError) as erro:
        raise RuntimeError(f"Não foi possível converter a imagem: {erro}") from erro

    if not destino.is_file() or destino.stat().st_size == 0:
        raise RuntimeError(f"WEBP inválido após conversão: {destino}")


def processar_arquivo(
    arquivo: Path,
    usar_ia: bool,
    simular: bool,
    logger: logging.Logger,
) -> Path | None:
    """Renomeia, converte quando necessário e transfere um arquivo admitido."""

    categoria = classificar_arquivo(arquivo)

    if categoria == "nao-suportado":
        logger.error("Extensão não suportada; arquivo mantido: %s", arquivo.name)
        return None

    if nome_esta_em_conformidade(arquivo):
        nome_base = arquivo.stem
        logger.info("Nome já está em conformidade e foi preservado: %s", arquivo.name)
    else:
        dados = obter_metadados(arquivo, categoria, usar_ia, logger)
        nome_base = montar_nome_base(categoria, dados)

    if categoria == "imagem":
        pasta_destino = PASTA_IMAGENS
        extensao_destino = ".webp"
    elif categoria == "video":
        pasta_destino = PASTA_VIDEOS
        extensao_destino = arquivo.suffix.lower()
    else:
        pasta_destino = PASTA_DOCUMENTOS
        extensao_destino = arquivo.suffix.lower()

    destino = destino_disponivel(pasta_destino, nome_base, extensao_destino)
    logger.info("Plano: %s -> %s", arquivo.name, destino.relative_to(RAIZ_PROJETO))

    if simular:
        return destino

    pasta_destino.mkdir(parents=True, exist_ok=True)

    if categoria == "imagem":
        if arquivo.suffix.lower() == ".webp":
            shutil.move(str(arquivo), str(destino))
        else:
            converter_para_webp(arquivo, destino)
            arquivo.unlink()
    else:
        shutil.move(str(arquivo), str(destino))

    logger.info("Arquivo admitido: %s", destino.relative_to(RAIZ_PROJETO))
    return destino


def executar_biblioteca(logger: logging.Logger, simular: bool) -> None:
    """Executa a automação Node responsável por atualizar a biblioteca."""

    if simular:
        logger.info("Simulação: node biblioteca-automation.js não foi executado.")
        return

    if not AUTOMACAO_BIBLIOTECA.is_file():
        raise FileNotFoundError(
            f"Automação da biblioteca não encontrada: {AUTOMACAO_BIBLIOTECA}"
        )

    logger.info("Executando: node biblioteca-automation.js")
    subprocess.run(
        ["node", AUTOMACAO_BIBLIOTECA.name],
        cwd=RAIZ_PROJETO,
        check=True,
    )
    logger.info("Automação da biblioteca concluída.")


def listar_arquivos_admissao() -> list[Path]:
    """Lista somente arquivos regulares diretamente na pasta de admissão."""

    PASTA_ADMISSAO.mkdir(parents=True, exist_ok=True)
    return sorted(
        (item for item in PASTA_ADMISSAO.iterdir() if item.is_file()),
        key=lambda item: item.name.casefold(),
    )


def criar_argumentos() -> argparse.Namespace:
    """Cria e interpreta os argumentos da linha de comando."""

    parser = argparse.ArgumentParser(
        description=(
            "Padroniza arquivos da admissão, converte imagens para WEBP, "
            "distribui por tipo e atualiza a biblioteca do site."
        )
    )
    parser.add_argument(
        "--simular",
        action="store_true",
        help="Exibe o plano sem converter, mover ou executar o Node.",
    )
    parser.add_argument(
        "--sem-ia",
        action="store_true",
        help="Desativa a análise opcional pela OpenAI.",
    )
    parser.add_argument(
        "--pular-biblioteca",
        action="store_true",
        help="Processa os arquivos sem executar biblioteca-automation.js.",
    )
    return parser.parse_args()


def main() -> int:
    """Executa as quatro etapas da admissão automatizada de arquivos."""

    argumentos = criar_argumentos()
    logger = configurar_logger()
    arquivos = listar_arquivos_admissao()

    logger.info("Início. Arquivos encontrados: %d", len(arquivos))

    if not arquivos:
        logger.info("Nenhum arquivo aguardando admissão.")
        return 0

    processados = []
    falhas = []

    for arquivo in arquivos:
        try:
            destino = processar_arquivo(
                arquivo,
                usar_ia=not argumentos.sem_ia,
                simular=argumentos.simular,
                logger=logger,
            )

            if destino is None:
                falhas.append(arquivo)
            else:
                processados.append(destino)
        except Exception as erro:
            falhas.append(arquivo)
            logger.exception(
                "Arquivo=%s função=processar_arquivo erro=%s causa=%s",
                arquivo.name,
                type(erro).__name__,
                erro,
            )

    if falhas:
        logger.error(
            "Biblioteca não executada: %d arquivo(s) permaneceram com erro.",
            len(falhas),
        )
        return 1

    if not argumentos.pular_biblioteca:
        try:
            executar_biblioteca(logger, argumentos.simular)
        except (FileNotFoundError, subprocess.CalledProcessError) as erro:
            logger.exception(
                "Arquivo=%s função=executar_biblioteca erro=%s causa=%s",
                AUTOMACAO_BIBLIOTECA.name,
                type(erro).__name__,
                erro,
            )
            return 1

    logger.info(
        "Fim. Processados: %d. Falhas: 0. Simulação: %s",
        len(processados),
        argumentos.simular,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
