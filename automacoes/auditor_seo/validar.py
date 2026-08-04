"""Validação pós-correção — confirma que as alterações foram corretas."""

from pathlib import Path

from .head_parser import HeadParser
from .auditor import PlanoCorrecao, auditar_arquivo
from .backup_manager import restaurar_backup
from .logger import get_logger

log = get_logger("validar")


def validar_pos_correcao(plano: PlanoCorrecao, caminho_backup: Path = None) -> bool:
    """Valida que as correções foram aplicadas corretamente.

    Estratégia:
        1. Relê o arquivo modificado
        2. Re-executa a auditoria (deve retornar tem_alteracoes=False)
        3. Verifica que os elementos adicionados estão presentes
        4. Se falhar, restaura do backup

    Args:
        plano: PlanoCorrecao original.
        caminho_backup: Caminho do backup para restore em caso de falha.

    Returns:
        True se a validação passou.
    """
    try:
        # Re-audita o arquivo modificado
        novo_plano = auditar_arquivo(plano.caminho)

        # Se ainda tem alterações, algo ficou errado
        if novo_plano.tem_alteracoes:
            log.error("❌ VALIDAÇÃO FALHOU: %s ainda tem %d alterações pendentes",
                      plano.caminho.name, len(novo_plano.corrigidos) + len(novo_plano.adicionados))
            for motivo in novo_plano.motivos:
                log.error("   → %s", motivo)
            _restaurar_se_necessario(plano.caminho, caminho_backup)
            return False

        # Verifica elementos adicionados manualmente
        parser = HeadParser(plano.caminho)

        if plano.canonical_adicionar:
            if not parser.has_canonical():
                log.error("❌ canonical não foi adicionado em %s", plano.caminho.name)
                _restaurar_se_necessario(plano.caminho, caminho_backup)
                return False

        log.info("✅ Validação OK: %s", plano.caminho.name)
        return True

    except Exception as e:
        log.error("❌ Erro na validação de %s: %s", plano.caminho.name, e)
        _restaurar_se_necessario(plano.caminho, caminho_backup)
        return False


def _restaurar_se_necessario(caminho: Path, backup: Path):
    """Restaura o arquivo do backup se disponível."""
    if backup and backup.exists():
        if restaurar_backup(caminho, backup):
            log.info("↩️  Arquivo restaurado do backup: %s", caminho.name)
    else:
        log.error("⚠️  Sem backup disponível para restaurar %s", caminho.name)
