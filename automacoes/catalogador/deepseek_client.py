"""Cliente da API DeepSeek via OpenAI SDK.

A API da DeepSeek é compatível com o protocolo OpenAI.
Basta configurar base_url e api_key.

Features:
    - Rate limiting local (máx RPM)
    - Retry com exponential backoff
    - Logging detalhado de tokens e custos
    - Timeout configurável
"""

import time
import json
import re
from typing import Optional

from openai import OpenAI

from .config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    DEEPSEEK_MAX_RPM,
    DEEPSEEK_MAX_RETRIES,
    DEEPSEEK_RETRY_DELAY,
    DEEPSEEK_TIMEOUT,
    DEEPSEEK_MAX_TOKENS_OUT,
    DEEPSEEK_COST_INPUT_PER_M,
    DEEPSEEK_COST_OUTPUT_PER_M,
)
from .logger import get_logger

log = get_logger("deepseek")
log_api = get_logger("deepseek")  # mesmo logger, vai para deepseek.log


# ── Prompt do Sistema ─────────────────────────────────────────────────

SYSTEM_PROMPT = """Você é um catalogador profissional de documentos da área da saúde e enfermagem.

Analise o trecho do documento fornecido e extraia EXATAMENTE as informações solicitadas.
Retorne EXCLUSIVAMENTE um JSON válido, sem texto adicional antes ou depois.
Se uma informação não estiver disponível no trecho, use null.
Para campos de lista (autor, palavras_chave), retorne SEMPRE um array de strings.

REGRAS IMPORTANTES:
1. Se houver várias datas, identifique corretamente:
   - ano_publicacao: ano da publicação original
   - ano_revisao: ano da revisão/atualização mais recente
2. Se houver vários títulos, identifique o TÍTULO OFICIAL (geralmente o primeiro e mais completo)
3. Para tipo_documental, classifique EXATAMENTE como um destes:
   artigo_cientifico, protocolo, pop, procedimento_operacional_padrao, resolucao, manual,
   diretriz, guideline, nota_tecnica, cartilha, livro, legislacao, portaria, tese,
   dissertacao, monografia, formulario, checklist, fluxograma, apresentacao, relatorio, outro
4. Para area_conhecimento, classifique como:
   Enfermagem, Medicina, Emergencia, UTI, Pediatria, Obstetricia, Centro_Cirurgico,
   Cardiologia, Neurologia, Farmacologia, Saude_Publica, Gestao_Hospitalar,
   Seguranca_do_Paciente, ou outra area relevante

CAMPOS A EXTRAIR (retorne TODOS, mesmo que null):
{
  "titulo": "string ou null",
  "subtitulo": "string ou null",
  "autor": ["string"] ou [],
  "instituicao": "string ou null",
  "orgao_governamental": "string ou null",
  "ministerio": "string ou null",
  "conselho": "string ou null",
  "universidade": "string ou null",
  "hospital": "string ou null",
  "secretaria_saude": "string ou null",
  "editora": "string ou null",
  "cidade": "string ou null",
  "estado": "string ou null",
  "pais": "string ou null",
  "idioma": "string ou null",
  "ano_publicacao": number ou null,
  "ano_revisao": number ou null,
  "versao": "string ou null",
  "codigo_interno": "string ou null",
  "doi": "string ou null",
  "isbn": "string ou null",
  "issn": "string ou null",
  "palavras_chave": ["string"] ou [],
  "especialidade": "string ou null",
  "categoria": "string ou null",
  "tipo_documental": "string ou null",
  "resumo": "string ou null",
  "area_conhecimento": "string ou null"
}"""


class DeepSeekClient:
    """Cliente para a API DeepSeek com rate limiting e retry."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or DEEPSEEK_API_KEY
        if not self.api_key:
            log.warning(
                "DEEPSEEK_API_KEY não definida! "
                "Defina a variável de ambiente ou passe a chave explicitamente."
            )

        self._client: Optional[OpenAI] = None  # lazy init

        # Rate limiting: controle de RPM
        self._request_times: list[float] = []
        self._total_input_tokens = 0
        self._total_output_tokens = 0
        self._total_cost = 0.0
        self._request_count = 0

    @property
    def client(self) -> OpenAI:
        """Inicializa o cliente OpenAI sob demanda (lazy)."""
        if self._client is None:
            if not self.api_key:
                raise RuntimeError(
                    "DEEPSEEK_API_KEY não configurada. "
                    "Defina a variável de ambiente DEEPSEEK_API_KEY."
                )
            self._client = OpenAI(
                api_key=self.api_key,
                base_url=DEEPSEEK_BASE_URL,
                timeout=DEEPSEEK_TIMEOUT,
            )
        return self._client

    # ── Rate Limiting ───────────────────────────────────────────────

    def _wait_if_needed(self):
        """Aguarda se o rate limit por minuto for excedido."""
        agora = time.time()
        # Remove timestamps com mais de 60 segundos
        self._request_times = [t for t in self._request_times if agora - t < 60]

        if len(self._request_times) >= DEEPSEEK_MAX_RPM:
            wait = 60 - (agora - self._request_times[0]) + 1
            if wait > 0:
                log.info("Rate limit: aguardando %.1fs...", wait)
                time.sleep(wait)

        self._request_times.append(time.time())

    # ── Chamada à API ───────────────────────────────────────────────

    def catalogar(self, snippet: dict) -> Optional[dict]:
        """Envia snippet para a DeepSeek e retorna metadados estruturados.

        Args:
            snippet: Dicionário com capa, headings, sumário e cabeçalho.

        Returns:
            Dicionário com metadados extraídos ou None em caso de falha.
        """
        # Monta o conteúdo do usuário
        user_content = self._montar_user_content(snippet)

        for tentativa in range(1, DEEPSEEK_MAX_RETRIES + 1):
            try:
                self._wait_if_needed()

                log.info("Chamada DeepSeek (tentativa %d/%d)...", tentativa, DEEPSEEK_MAX_RETRIES)
                log_api.debug("Prompt size: ~%d chars", len(user_content))

                response = self.client.chat.completions.create(
                    model=DEEPSEEK_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    max_tokens=DEEPSEEK_MAX_TOKENS_OUT,
                    temperature=0,  # máxima determinismo
                    response_format={"type": "json_object"},
                )

                # Extrai uso de tokens
                usage = response.usage
                if usage:
                    self._total_input_tokens += usage.prompt_tokens
                    self._total_output_tokens += usage.completion_tokens
                    cost = self._calcular_custo(usage.prompt_tokens, usage.completion_tokens)
                    self._total_cost += cost
                    self._request_count += 1

                    log_api.info(
                        "Tokens: in=%d out=%d total=%d | Custo: $%.5f | Acumulado: $%.4f",
                        usage.prompt_tokens,
                        usage.completion_tokens,
                        usage.total_tokens,
                        cost,
                        self._total_cost,
                    )

                # Parse da resposta
                conteudo = response.choices[0].message.content
                log.debug("Resposta DeepSeek: %s...", conteudo[:200] if conteudo else "vazia")

                resultado = self._parse_resposta(conteudo)
                if resultado:
                    return resultado

                log.warning("Resposta da DeepSeek não continha JSON válido. Tentativa %d/%d.",
                            tentativa, DEEPSEEK_MAX_RETRIES)

            except Exception as e:
                log.error("Erro na chamada DeepSeek (tentativa %d/%d): %s",
                          tentativa, DEEPSEEK_MAX_RETRIES, e)
                if tentativa < DEEPSEEK_MAX_RETRIES:
                    delay = DEEPSEEK_RETRY_DELAY * (2 ** (tentativa - 1))
                    log.info("Retry em %.1fs...", delay)
                    time.sleep(delay)

        log.error("Todas as %d tentativas falharam para a chamada DeepSeek.", DEEPSEEK_MAX_RETRIES)
        return None

    # ── Métodos auxiliares ──────────────────────────────────────────

    def _montar_user_content(self, snippet: dict) -> str:
        """Monta o conteúdo do usuário a partir do snippet."""
        partes = [
            "=== CABEÇALHO ===",
            snippet.get("cabecalho", ""),
            "",
            "=== CAPA DO DOCUMENTO ===",
            snippet.get("capa", ""),
        ]

        headings = snippet.get("headings", "")
        if headings:
            partes.extend(["", "=== PRINCIPAIS SEÇÕES ===", headings])

        sumario = snippet.get("sumario", "")
        if sumario:
            partes.extend(["", "=== SUMÁRIO ===", sumario])

        return "\n".join(partes)

    def _parse_resposta(self, conteudo: str) -> Optional[dict]:
        """Faz o parse da resposta JSON da DeepSeek.

        Tenta múltiplas estratégias para extrair JSON válido.
        """
        if not conteudo:
            return None

        # Estratégia 1: parse direto
        try:
            return json.loads(conteudo)
        except json.JSONDecodeError:
            pass

        # Estratégia 2: extrair bloco JSON com regex
        match = re.search(r'\{[\s\S]*\}', conteudo)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Estratégia 3: reparar JSON comum (aspas simples, trailing commas)
        try:
            reparado = (
                conteudo.replace("'", '"')
                .replace("None", "null")
                .replace("True", "true")
                .replace("False", "false")
            )
            # Remove trailing commas
            reparado = re.sub(r",\s*}", "}", reparado)
            reparado = re.sub(r",\s*]", "]", reparado)
            return json.loads(reparado)
        except (json.JSONDecodeError, Exception):
            pass

        log.error("Não foi possível fazer parse da resposta DeepSeek.")
        log.debug("Conteúdo bruto: %s", conteudo[:500])
        return None

    @staticmethod
    def _calcular_custo(input_tokens: int, output_tokens: int) -> float:
        """Calcula custo estimado em USD."""
        cost_in = (input_tokens / 1_000_000) * DEEPSEEK_COST_INPUT_PER_M
        cost_out = (output_tokens / 1_000_000) * DEEPSEEK_COST_OUTPUT_PER_M
        return cost_in + cost_out

    # ── Propriedades ────────────────────────────────────────────────

    @property
    def total_input_tokens(self) -> int:
        return self._total_input_tokens

    @property
    def total_output_tokens(self) -> int:
        return self._total_output_tokens

    @property
    def total_tokens(self) -> int:
        return self._total_input_tokens + self._total_output_tokens

    @property
    def total_cost(self) -> float:
        return self._total_cost

    @property
    def request_count(self) -> int:
        return self._request_count
