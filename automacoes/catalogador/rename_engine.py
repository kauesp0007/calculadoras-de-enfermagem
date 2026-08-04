"""Motor de renomeação de PDFs com padrão SEO.

Padrão: ANO_INSTITUICAO_CODIGO_TITULO.pdf

Regras:
    - Nunca utiliza espaços (substitui por "_")
    - Remove acentos, cedilha, caracteres especiais
    - Remove aspas, parênteses, colchetes
    - Remove múltiplos "_" consecutivos
    - Apenas letras, números, ponto, hífen e underline
    - Preserva extensão ".pdf"
    - Compatível com Windows, Linux e macOS
"""

from typing import Optional

from .utils import normalizar_nome_arquivo
from .logger import get_logger

log = get_logger("rename_engine")


class RenameEngine:
    """Gera novos nomes para PDFs seguindo o padrão SEO estabelecido."""

    # Comprimento máximo para componentes do nome
    MAX_TITULO = 80      # caracteres (antes da normalização)
    MAX_INSTITUICAO = 40
    MAX_CODIGO = 20
    MAX_NOME_TOTAL = 200  # limite total do nome do arquivo

    @staticmethod
    def gerar_novo_nome(
        ano: Optional[int] = None,
        instituicao: Optional[str] = None,
        codigo: Optional[str] = None,
        titulo: Optional[str] = None,
        **kwargs,  # campos extras ignorados na formação do nome
    ) -> str:
        """Gera o novo nome do arquivo seguindo o padrão.

        Args:
            ano: Ano de publicação (ex: 2024).
            instituicao: Instituição responsável (ex: Ministerio_da_Saude).
            codigo: Código interno do documento (ex: POP.DEA.006).
            titulo: Título do documento.

        Returns:
            Nome normalizado no formato ANO_INSTITUICAO_CODIGO_TITULO.pdf
        """
        partes = []

        # ── Ano ──────────────────────────────────────────────────────
        if ano and 1900 <= ano <= 2030:
            partes.append(str(ano))
        else:
            partes.append("XXXX")

        # ── Instituição ──────────────────────────────────────────────
        if instituicao:
            inst_norm = RenameEngine._normalizar_componente(
                instituicao, RenameEngine.MAX_INSTITUICAO
            )
            if inst_norm:
                partes.append(inst_norm)

        # ── Código ───────────────────────────────────────────────────
        if codigo:
            cod_norm = RenameEngine._normalizar_componente(
                codigo, RenameEngine.MAX_CODIGO
            )
            if cod_norm:
                partes.append(cod_norm)

        # ── Título ───────────────────────────────────────────────────
        if titulo:
            titulo_norm = RenameEngine._normalizar_componente(
                titulo, RenameEngine.MAX_TITULO
            )
            if titulo_norm:
                partes.append(titulo_norm)

        # ── Monta nome final ─────────────────────────────────────────
        nome = "_".join(partes)

        # Trunca se exceder o limite total
        if len(nome) > RenameEngine.MAX_NOME_TOTAL:
            nome = nome[: RenameEngine.MAX_NOME_TOTAL]

        # Garante extensão .pdf
        if not nome.lower().endswith(".pdf"):
            nome += ".pdf"

        log.debug("Nome gerado: %s", nome)
        return nome

    @staticmethod
    def _normalizar_componente(texto: str, max_len: int = 80) -> str:
        """Normaliza um componente individual do nome.

        Args:
            texto: Texto a normalizar.
            max_len: Comprimento máximo após normalização.

        Returns:
            String normalizada ou vazia.
        """
        if not texto:
            return ""

        # Trunca antes de normalizar (evita perda de contexto por acentos)
        texto = texto.strip()[:max_len * 2]

        # Aplica normalização completa
        normalizado = normalizar_nome_arquivo(texto)

        # Trunca novamente após normalizar
        if len(normalizado) > max_len:
            normalizado = normalizado[:max_len]

        # Remove underscore do final (pode ter ficado após truncar)
        normalizado = normalizado.strip("_")

        return normalizado

    @staticmethod
    def gerar_nome_fallback(nome_original: str, metadados: dict) -> str:
        """Gera um nome baseado em heurísticas quando a IA falha.

        Args:
            nome_original: Nome original do arquivo.
            metadados: Metadados extraídos do PDF.

        Returns:
            Nome gerado por fallback.
        """
        from .utils import extrair_ano

        # Tenta extrair ano do nome ou metadados
        ano = extrair_ano(nome_original)
        if not ano and metadados.get("title"):
            ano = extrair_ano(metadados["title"])

        # Usa o nome original como "título" (sem extensão)
        titulo = nome_original.replace(".pdf", "").replace(".PDF", "")

        return RenameEngine.gerar_novo_nome(
            ano=ano,
            instituicao=None,
            codigo=None,
            titulo=titulo,
        )

    @staticmethod
    def validar_nome(nome: str) -> bool:
        """Valida se o nome gerado segue todas as regras.

        Returns:
            True se o nome é válido.
        """
        if not nome.lower().endswith(".pdf"):
            return False

        nome_sem_ext = nome[:-4]

        # Não pode conter espaços
        if " " in nome_sem_ext:
            return False

        # Não pode conter caracteres inválidos
        import re
        if re.search(r'[<>:"/\\|?*\'\"\(\)\[\]\{\}]', nome_sem_ext):
            return False

        # Não pode ter underlines múltiplos
        if "__" in nome_sem_ext:
            return False

        # Não pode começar ou terminar com underline ou hífen
        if nome_sem_ext.startswith("_") or nome_sem_ext.startswith("-"):
            return False
        if nome_sem_ext.endswith("_") or nome_sem_ext.endswith("-"):
            return False

        return True
