"""Ponto de entrada do Auditor SEO.

Modos:
    python -m automacoes.auditor_seo.main --fix     # Audita e corrige
    python -m automacoes.auditor_seo.main --audit   # Apenas audita (dry-run)
    python -m automacoes.auditor_seo.main --report  # Apenas relatório
"""

import sys
import time
import argparse
import logging
from pathlib import Path

from .config import RAIZ
from .logger import configurar_logging, get_logger
from .scanner import escanear_htmls
from .auditor import auditar_arquivo
from .corrector import aplicar_correcoes
from .validar import validar_pos_correcao
from .backup_manager import criar_backup, hash_arquivo
from .relatorio import RelatorioAuditoria

log = get_logger("main")


def main():
    parser = argparse.ArgumentParser(
        description="🔍 Auditoria Corretiva de SEO — Calculadoras de Enfermagem",
    )
    parser.add_argument("--fix", action="store_true",
                        help="Audita e corrige todos os arquivos HTML")
    parser.add_argument("--audit", action="store_true",
                        help="Apenas audita (dry-run, sem modificar)")
    parser.add_argument("--file", type=str,
                        help="Audita/corrige apenas um arquivo específico")
    parser.add_argument("--report", action="store_true",
                        help="Apenas gera relatório")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Logging detalhado")
    args = parser.parse_args()

    nivel = logging.DEBUG if args.verbose else logging.INFO
    configurar_logging(level=nivel)

    if not any([args.fix, args.audit, args.report, args.file]):
        args.audit = True  # default: dry-run

    relatorio = RelatorioAuditoria()

    # ── Obter lista de arquivos ──────────────────────────────────────
    if args.file:
        caminho = RAIZ / args.file
        if not caminho.exists():
            log.error("Arquivo não encontrado: %s", args.file)
            sys.exit(1)
        arquivos = [caminho.resolve()]
    else:
        arquivos = escanear_htmls()
        log.info("🔍 %d arquivos HTML encontrados para auditoria", len(arquivos))

    # ── Processar ────────────────────────────────────────────────────
    for i, caminho in enumerate(arquivos, 1):
        nome = caminho.name
        log.info("[%d/%d] %s", i, len(arquivos), nome)

        try:
            # Auditoria
            plano = auditar_arquivo(caminho)
            hash_antes = hash_arquivo(caminho)

            if not plano.tem_alteracoes:
                relatorio.registrar(plano, hash_antes, hash_antes)
                continue

            if args.audit:
                # Dry-run: apenas reporta
                log.info("  [DRY-RUN] %d alterações necessárias:", len(plano.motivos))
                for m in plano.motivos:
                    log.info("    → %s", m)
                relatorio.registrar(plano, hash_antes, hash_antes, sucesso=False,
                                    erro_msg="dry-run: não modificado")
                continue

            # ── FIX: aplicar correções ────────────────────────────────
            backup_path = None
            try:
                # Backup
                _, backup_path = criar_backup(caminho)

                # Corrigir
                html_corrigido = aplicar_correcoes(plano)
                caminho.write_text(html_corrigido, encoding="utf-8")

                hash_depois = hash_arquivo(caminho)

                # Validar
                if validar_pos_correcao(plano, backup_path):
                    relatorio.registrar(plano, hash_antes, hash_depois, sucesso=True)
                    log.info("  ✅ Corrigido: %s", ", ".join(plano.motivos))
                else:
                    relatorio.registrar(plano, hash_antes, hash_depois, sucesso=False,
                                        erro_msg="validação pós-correção falhou")
            except Exception as e:
                log.error("  ❌ Erro ao corrigir %s: %s", nome, e)
                relatorio.registrar(plano, hash_antes, "", sucesso=False, erro_msg=str(e))

            # Pequena pausa
            time.sleep(0.05)

        except Exception as e:
            log.error("❌ Erro fatal em %s: %s", nome, e)
            relatorio.registrar(None, "", "", sucesso=False, erro_msg=str(e))

    # ── Relatório final ──────────────────────────────────────────────
    relatorio.gerar_csv()
    relatorio.gerar_txt()

    # Resumo no console
    print()
    print("=" * 55)
    print("  🔍 AUDITORIA SEO CONCLUÍDA")
    print("=" * 55)
    print(f"  Total HTMLs:     {relatorio.total_htmls}")
    print(f"  Sem alterações:  {relatorio.sem_alteracoes}")
    print(f"  Corrigidos:      {relatorio.corrigidos}")
    print(f"  Erros:           {relatorio.erros}")
    print()
    print(f"  Canonicals:      {relatorio.canonicals_corrigidos}C / {relatorio.canonicals_adicionados}A")
    print(f"  og:url:          {relatorio.og_urls_corrigidos}C")
    print(f"  twitter:url:     {relatorio.twitter_urls_corrigidos}C / {relatorio.twitter_urls_adicionados}A")
    print(f"  Hreflangs:       {relatorio.hreflangs_corrigidos}C / {relatorio.hreflangs_adicionados}A")
    print(f"  JSON-LD:         {relatorio.jsonlds_corrigidos}C")
    print("=" * 55)


if __name__ == "__main__":
    main()
