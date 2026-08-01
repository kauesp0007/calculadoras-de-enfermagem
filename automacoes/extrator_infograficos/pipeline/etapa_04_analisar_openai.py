import base64
import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from time import perf_counter
from typing import Any

from config import (
    CACHE,
    CATEGORIAS_COMPONENTES,
    CATEGORIAS_EXTRAIVEIS,
    LOGS,
    MAXIMO_TENTATIVAS_OPENAI,
    MODELO_OPENAI,
    SAIDA,
    TEMP,
)
from openai_client import client


PROMPT = """
Classifique somente o componente gráfico apresentado. Não transcreva textos.
Use uma das categorias permitidas. Marque extrair=true apenas para logo,
icone, imagem ou fotografia. Responda exclusivamente no formato JSON pedido.
""".strip()

ESQUEMA_CLASSIFICACAO = {
    "type": "object",
    "properties": {
        "tipo": {"type": "string"},
        "categoria": {
            "type": "string",
            "enum": list(CATEGORIAS_COMPONENTES),
        },
        "nome": {"type": "string"},
        "descricao": {"type": "string"},
        "extrair": {"type": "boolean"},
    },
    "required": ["tipo", "categoria", "nome", "descricao", "extrair"],
    "additionalProperties": False,
}


def configurar_logger() -> logging.Logger:
    """Configura o logger da etapa 04 no padrão oficial do projeto."""

    LOGS.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("ETAPA_04")

    if logger.handlers:
        return logger

    arquivo_log = LOGS / f"{datetime.now():%Y-%m-%d}.log"
    manipulador = logging.FileHandler(arquivo_log, encoding="utf-8")
    manipulador.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(manipulador)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


def calcular_hash(arquivo: Path) -> str:
    """Calcula o SHA-256 de um componente para identificar seu cache."""

    return hashlib.sha256(arquivo.read_bytes()).hexdigest()


def caminho_cache(arquivo: Path) -> Path:
    """Retorna o caminho de cache correspondente ao conteúdo do arquivo."""

    return CACHE / f"{calcular_hash(arquivo)}.json"


def validar_classificacao(dados: Any) -> dict[str, Any]:
    """Valida estrutura, campos, tipos e regras da classificação da OpenAI."""

    if not isinstance(dados, dict):
        raise ValueError("A resposta deve ser um objeto JSON.")

    campos = {"tipo", "categoria", "nome", "descricao", "extrair"}

    if set(dados) != campos:
        raise ValueError("A resposta não contém exatamente os campos obrigatórios.")

    for campo in ("tipo", "categoria", "nome", "descricao"):
        if not isinstance(dados[campo], str):
            raise TypeError(f"O campo '{campo}' deve ser uma string.")

    if not isinstance(dados["extrair"], bool):
        raise TypeError("O campo 'extrair' deve ser booleano.")

    categoria = dados["categoria"]

    if categoria not in CATEGORIAS_COMPONENTES:
        raise ValueError(f"Categoria inválida: {categoria}")

    extrair_esperado = categoria in CATEGORIAS_EXTRAIVEIS

    if dados["extrair"] is not extrair_esperado:
        raise ValueError("O valor de 'extrair' não corresponde à categoria.")

    return dados


def carregar_cache(arquivo: Path, logger: logging.Logger) -> dict[str, Any] | None:
    """Carrega e valida uma classificação armazenada em cache."""

    arquivo_cache = caminho_cache(arquivo)

    if not arquivo_cache.exists():
        return None

    try:
        with arquivo_cache.open("r", encoding="utf-8") as fluxo:
            dados = json.load(fluxo)
        classificacao = validar_classificacao(dados)
        logger.info("Cache reutilizado: %s", arquivo.name)
        return classificacao
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as erro:
        logger.warning("Cache inválido para %s: %s", arquivo.name, erro)
        return None


def salvar_cache(
    arquivo: Path,
    classificacao: dict[str, Any],
    logger: logging.Logger,
) -> None:
    """Salva uma classificação validada no cache da etapa 04."""

    CACHE.mkdir(parents=True, exist_ok=True)
    arquivo_cache = caminho_cache(arquivo)

    with arquivo_cache.open("w", encoding="utf-8") as fluxo:
        json.dump(classificacao, fluxo, indent=4, ensure_ascii=False)

    logger.info("Cache criado: %s", arquivo.name)


def codificar_imagem(arquivo: Path) -> str:
    """Codifica um componente PNG como URL de dados para a OpenAI."""

    imagem_base64 = base64.b64encode(arquivo.read_bytes()).decode("utf-8")
    return f"data:image/png;base64,{imagem_base64}"


def solicitar_classificacao(arquivo: Path) -> dict[str, Any]:
    """Envia um componente à OpenAI e retorna sua classificação validada."""

    resposta = client.responses.create(
        model=MODELO_OPENAI,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": PROMPT},
                    {
                        "type": "input_image",
                        "image_url": codificar_imagem(arquivo),
                    },
                ],
            }
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "classificacao_componente",
                "schema": ESQUEMA_CLASSIFICACAO,
                "strict": True,
            }
        },
    )

    if not resposta.output_text:
        raise ValueError("A OpenAI retornou uma resposta vazia.")

    dados = json.loads(resposta.output_text)
    return validar_classificacao(dados)


def classificar_componente(
    arquivo: Path,
    logger: logging.Logger,
) -> dict[str, Any]:
    """Classifica um componente usando cache e tentativas controladas."""

    classificacao_cache = carregar_cache(arquivo, logger)

    if classificacao_cache is not None:
        return classificacao_cache

    ultimo_erro: Exception | None = None

    for tentativa in range(1, MAXIMO_TENTATIVAS_OPENAI + 1):
        try:
            classificacao = solicitar_classificacao(arquivo)
            salvar_cache(arquivo, classificacao, logger)
            logger.info("Resposta válida: %s", arquivo.name)
            return classificacao
        except Exception as erro:
            ultimo_erro = erro
            logger.error(
                "Arquivo=%s função=classificar_componente tentativa=%d erro=%s causa=%s",
                arquivo.name,
                tentativa,
                type(erro).__name__,
                erro,
            )

    raise RuntimeError(
        f"Falha ao classificar {arquivo.name} após "
        f"{MAXIMO_TENTATIVAS_OPENAI} tentativas: {ultimo_erro}"
    ) from ultimo_erro


def classificacao_indisponivel(arquivo: Path) -> dict[str, Any]:
    """Cria uma classificação segura quando a API está indisponível."""

    return {
        "tipo": "não classificado",
        "categoria": "decoracao",
        "nome": arquivo.stem,
        "descricao": "Classificação pendente devido à indisponibilidade da OpenAI.",
        "extrair": False,
    }


def salvar_layout(layout: dict[str, Any]) -> Path:
    """Valida o resultado agregado e salva o layout em JSON UTF-8."""

    if not isinstance(layout.get("componentes"), list):
        raise ValueError("O layout não contém uma lista de componentes.")

    SAIDA.mkdir(parents=True, exist_ok=True)
    arquivo_saida = SAIDA / "layout.json"

    with arquivo_saida.open("w", encoding="utf-8") as fluxo:
        json.dump(layout, fluxo, indent=4, ensure_ascii=False)

    return arquivo_saida


def analisar_layout(imagem: Path) -> dict[str, Any]:
    """Classifica os recortes exportados e gera o layout da imagem informada."""

    print("\n========================================")
    print("ETAPA 04 - CLASSIFICAR OBJETOS")
    print("========================================")

    inicio = perf_counter()
    logger = configurar_logger()
    pasta_objetos = TEMP / "objetos"

    if not imagem.is_file():
        raise FileNotFoundError(f"Imagem original não encontrada: {imagem}")

    arquivos = sorted(pasta_objetos.glob("objeto_*.png"))

    if not arquivos:
        raise FileNotFoundError(f"Nenhum objeto exportado em: {pasta_objetos}")

    logger.info(
        "Início. Modelo=%s objetos=%d imagem=%s",
        MODELO_OPENAI,
        len(arquivos),
        imagem.name,
    )

    componentes: list[dict[str, Any]] = []
    api_disponivel = True

    for indice, arquivo in enumerate(arquivos, start=1):
        if api_disponivel:
            try:
                classificacao = classificar_componente(arquivo, logger)
            except RuntimeError as erro:
                api_disponivel = False
                logger.error("OpenAI indisponível; chamadas interrompidas: %s", erro)
                classificacao = classificacao_indisponivel(arquivo)
        else:
            classificacao = classificacao_indisponivel(arquivo)

        componentes.append(
            {
                "id": indice,
                "arquivo": arquivo.name,
                **classificacao,
            }
        )

    layout = {
        "pagina": {"titulo": imagem.stem, "tipo": "infografico"},
        "componentes": componentes,
    }
    arquivo_saida = salvar_layout(layout)
    tempo_total = perf_counter() - inicio
    classificados = sum(
        componente["descricao"]
        != "Classificação pendente devido à indisponibilidade da OpenAI."
        for componente in componentes
    )

    logger.info(
        "Fim. objetos=%d classificados=%d tempo=%.2fs saída=%s",
        len(componentes),
        classificados,
        tempo_total,
        arquivo_saida.name,
    )
    print(f"Objetos processados: {len(componentes)}")
    print(f"Objetos classificados: {classificados}")
    print(f"Arquivo criado: {arquivo_saida.name}")
    return layout
