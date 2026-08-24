"""Chamadas às APIs de tradução (DeepSeek / OpenAI) — Etapa 3.

- Uma única função pública: `traduzir_payload(payload, idioma_destino)`.
- Retry com backoff, timeout centralizado e validação de resposta.
- Chaves de API NUNCA aparecem em logs.
"""

import json
import re
import time

import requests

from automacoes.translation import config, logger
from automacoes.translation.glossary import carregar_glossario, consultar_glossario
from automacoes.translation.validator import validar_json_resposta

_PADRAO_FENCE_INICIO = re.compile(r"^\s*```(?:json)?\s*\n", re.IGNORECASE)
_PADRAO_FENCE_FIM = re.compile(r"\n```\s*$")


def _limpar_fences(texto):
    """Remove marcações markdown que alguns modelos inserem."""
    texto = _PADRAO_FENCE_INICIO.sub("", texto.strip())
    return _PADRAO_FENCE_FIM.sub("", texto).strip()


def _montar_instrucoes(payload, idioma_destino):
    """Instruções do sistema + termos preferenciais do glossário."""
    nome_idioma = config.NOMES_IDIOMAS.get(idioma_destino, idioma_destino)

    instrucoes = f"""
Você é um especialista em localização de sites de saúde/enfermagem.
Receberá um JSON onde cada chave é um identificador e o valor contém
"type", "context" e "text". Traduza SOMENTE o campo "text" do Português
(pt-BR) para {nome_idioma} ({idioma_destino}).

REGRAS INEGOCIÁVEIS:
1. DEVOLVA EXCLUSIVAMENTE um JSON válido com as MESMAS chaves recebidas.
2. Cada valor deve ser APENAS o texto traduzido (string), sem campos extras.
3. Preserve números, unidades de medida, siglas clínicas reconhecidas e
   nomes próprios de escalas/testes quando forem marcas consagradas.
4. Adapte termos de enfermagem à terminologia usada neste idioma alvo.
5. Se o texto contiver ${...} (interpolação), preserve EXATAMENTE esses
   marcadores ${...} no texto traduzido, sem alterá-los nem reordená-los.
6. Se o texto contiver tags HTML (ex.: <strong>, <li>), traduza APENAS as
   palavras legíveis e preserve rigorosamente tags, atributos e classes.
7. Nada de markdown, explicações ou texto fora do JSON.
"""

    glossario = carregar_glossario()
    termos = []
    vistos = set()
    origem = glossario.get(config.IDIOMA_ORIGEM, {})
    for item in payload.values():
        texto = item.get("text", "")
        for termo in origem:
            if termo in texto and termo not in vistos:
                destino = consultar_glossario(
                    termo, idioma_destino, glossario=glossario
                )
                if destino:
                    termos.append(f'- "{termo}" → "{destino}"')
                    vistos.add(termo)

    if termos:
        instrucoes += (
            "\nTERMOS PREFERENCIAIS (use estas traduções quando aparecerem):\n"
            + "\n".join(termos)
        )

    return instrucoes


def _post_unico(provider, mensagens):
    """Uma única chamada HTTP. Levanta exceção em caso de falha."""
    chave = config.API_KEYS.get(provider)
    if not chave:
        raise ValueError(
            f"Chave de API ausente para '{provider}'. "
            f"Defina a variável de ambiente correspondente no .env."
        )

    url = config.ENDPOINTS[provider]
    headers = {
        "Authorization": f"Bearer {chave}",
        "Content-Type": "application/json",
    }
    payload_api = {
        "model": config.MODELOS[provider],
        "messages": mensagens,
        "temperature": 0.0,
        "response_format": {"type": "json_object"},
    }

    resposta = requests.post(
        url,
        headers=headers,
        json=payload_api,
        timeout=(config.TIMEOUT_CONEXAO, config.TIMEOUT_LEITURA),
    )
    resposta.raise_for_status()
    conteudo = resposta.json()["choices"][0]["message"]["content"].strip()
    return _limpar_fences(conteudo)


def traduzir_payload(payload, idioma_destino, provider=None):
    """Traduz {id: {type, context, text}} → {id: texto traduzido}.

    Retry com backoff; valida que a resposta contém exatamente as mesmas
    chaves do payload. Em falha definitiva, levanta RuntimeError.
    """
    provider = provider or config.TRANSLATION_PROVIDER
    if provider not in config.API_KEYS:
        raise ValueError(f"Provider desconhecido: '{provider}'")

    instrucoes = _montar_instrucoes(payload, idioma_destino)
    mensagens = [
        {"role": "system", "content": instrucoes},
        {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
    ]

    ultimo_erro = None
    for tentativa in range(1, config.MAX_TENTATIVAS + 1):
        try:
            conteudo = _post_unico(provider, mensagens)
            dados = json.loads(conteudo)
            # Alguns modelos devolvem o objeto completo {type, context, text}
            # no lugar da string traduzida — normaliza aqui.
            dados = {
                chave: (
                    valor.get("text")
                    if isinstance(valor, dict) and "text" in valor
                    else valor
                )
                for chave, valor in dados.items()
            }
            ok, problemas = validar_json_resposta(payload, dados)
            if not ok:
                raise ValueError("; ".join(problemas))
            return dados
        except Exception as e:
            ultimo_erro = e
            logger.aviso(
                f"Provider {provider} — tentativa {tentativa}/"
                f"{config.MAX_TENTATIVAS} falhou: {e}"
            )
            if tentativa < config.MAX_TENTATIVAS:
                espera = config.BACKOFF_BASE_SEGUNDOS * tentativa
                time.sleep(espera)

    raise RuntimeError(
        f"Falha após {config.MAX_TENTATIVAS} tentativas no provider "
        f"'{provider}': {ultimo_erro}"
    )


def resolver_providers():
    """Lista de providers conforme a configuração (para dividir lotes)."""
    if config.TRANSLATION_PROVIDER == "both":
        return ["deepseek", "openai"]
    return [config.TRANSLATION_PROVIDER]
