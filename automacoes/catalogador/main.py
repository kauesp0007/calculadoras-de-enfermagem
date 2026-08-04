"""Ponto de entrada principal do Catalogador Inteligente de PDFs.

Modos de execução:
    python -m automacoes.catalogador.main --watch      Monitoramento contínuo
    python -m automacoes.catalogador.main --once        Processa todos e encerra
    python -m automacoes.catalogador.main --stats       Apenas exibe estatísticas
    python -m automacoes.catalogador.main --reprocess   Força reprocessamento total
"""

import sys
import time
import argparse
from pathlib import Path
from datetime import datetime

from .config import DOCS_DIR
from .logger import configurar_logging, get_logger
from .database import Database
from .hash_manager import HashManager
from .pdf_reader import PDFReader
from .ocr_engine import OCREngine
from .snippet_builder import SnippetBuilder
from .cache_manager import CacheManager
from .deepseek_client import DeepSeekClient
from .classifier import Classifier
from .rename_engine import RenameEngine
from .output_generator import OutputGenerator
from .watcher import DocWatcher
from .tui import TerminalUI, RICH_DISPONIVEL

log = get_logger("main")


class CatalogadorPipeline:
    """Orquestrador do pipeline completo de catalogação."""

    def __init__(self):
        """Inicializa todos os componentes do sistema."""
        # Infraestrutura
        self.db = Database()
        self.cache = CacheManager()
        self.hash_manager = HashManager(self.db)

        # Pipeline
        self.deepseek = DeepSeekClient()
        self.classifier = Classifier()
        self.rename_engine = RenameEngine()
        self.output = OutputGenerator(self.db)

        # Interface
        self.tui = TerminalUI(self.db)

        # Contadores
        self.total = 0
        self.processados = 0
        self.ignorados = 0
        self.renomeados = 0
        self.erros_count = 0

    # ── Processamento individual ────────────────────────────────────

    def processar_pdf(self, caminho: Path) -> bool:
        """Executa o pipeline completo para um único PDF.

        Args:
            caminho: Caminho absoluto para o arquivo PDF.

        Returns:
            True se processado com sucesso.
        """
        nome = caminho.name
        log.info("─" * 50)
        log.info("Processando: %s", nome)

        # ── Etapa 1: Verificar hash ──────────────────────────────────
        resultado_hash = self.hash_manager.verificar(caminho)

        if resultado_hash.acao == "ignorar":
            log.info("IGNORADO: %s — %s", nome, resultado_hash.motivo)
            self.ignorados += 1
            return True  # não é erro, apenas pulou

        log.info("Ação: %s — %s", resultado_hash.acao.upper(), resultado_hash.motivo)

        # ── Etapa 2: Verificar cache ─────────────────────────────────
        hash_val = resultado_hash.hash_sha256
        cached = self.cache.get(hash_val)
        if cached:
            log.info("Cache HIT — usando resposta armazenada.")
            metadados_ia = cached
        else:
            # ── Etapa 3: Ler PDF ─────────────────────────────────────
            try:
                with PDFReader(caminho) as reader:
                    metadados_pdf = reader.extrair_metadados()
                    texto = reader.extrair_texto()
                    num_paginas = reader.num_paginas
                    tamanho = reader.tamanho_bytes
                    data_mod = reader.data_modificacao

                    # OCR se necessário
                    if not reader.tem_texto_suficiente(texto):
                        log.info("Texto insuficiente (%d chars). Executando OCR...", len(texto))
                        with OCREngine(caminho) as ocr:
                            texto_ocr = ocr.extrair_texto_ocr()
                            if texto_ocr:
                                texto = texto_ocr
            except Exception as e:
                log.error("Erro ao ler PDF %s: %s", nome, e)
                self.output.salvar_erro(hash_val, nome, caminho, str(e))
                self.erros_count += 1
                return False

            # ── Etapa 4: Construir snippet ───────────────────────────
            snippet_builder = SnippetBuilder(
                texto_completo=texto,
                metadados=metadados_pdf,
                num_paginas=num_paginas,
                nome_arquivo=nome,
            )
            snippet = snippet_builder.construir()
            log.info("Snippet construído: %d chars", snippet.get("total_chars", 0))

            # ── Etapa 5: Classificar via DeepSeek ────────────────────
            resposta_ia = self.deepseek.catalogar(snippet)

            if resposta_ia:
                metadados_ia = self.classifier.validar(resposta_ia, nome)
                # Armazena no cache
                self.cache.set(hash_val, metadados_ia)
            else:
                # Fallback: classificação por heurística
                log.warning("DeepSeek falhou. Usando classificação por heurística.")
                metadados_ia = self.classifier.classificar_por_heuristica(nome, texto)

        # ── Etapa 6: Gerar novo nome ─────────────────────────────────
        novo_nome = self.rename_engine.gerar_novo_nome(
            ano=metadados_ia.get("ano_publicacao"),
            instituicao=(
                metadados_ia.get("instituicao")
                or metadados_ia.get("orgao_governamental")
                or metadados_ia.get("conselho")
                or metadados_ia.get("ministerio")
                or metadados_ia.get("universidade")
                or metadados_ia.get("hospital")
            ),
            codigo=metadados_ia.get("codigo_interno"),
            titulo=(
                metadados_ia.get("titulo")
                or metadados_ia.get("subtitulo")
            ),
        )

        # Fallback se nome ficou genérico demais
        if "XXXX" in novo_nome and not metadados_ia.get("titulo"):
            novo_nome = self.rename_engine.gerar_nome_fallback(nome, metadados_pdf)

        # ── Etapa 7: Renomear arquivo ────────────────────────────────
        sucesso, novo_caminho = self.output.renomear_arquivo(caminho, novo_nome)
        if sucesso:
            self.renomeados += 1
            caminho_final = novo_caminho or caminho
        else:
            caminho_final = caminho

        # ── Etapa 8: Salvar no banco ─────────────────────────────────
        self.output.salvar_registro(
            hash_sha256=hash_val,
            nome_original=nome,
            nome_novo=novo_nome,
            caminho=caminho_final,
            tamanho_bytes=tamanho,
            num_paginas=num_paginas,
            metadados_ia=metadados_ia,
            versao=resultado_hash.versao,
        )

        self.processados += 1
        log.info("✅ SUCESSO: %s → %s", nome, novo_nome)
        return True

    # ── Processamento em lote ───────────────────────────────────────

    def processar_todos(self, simular: bool = False):
        """Processa todos os PDFs da pasta docs/.

        Args:
            simular: Se True, não renomeia nem salva no banco.
        """
        pdfs = self.hash_manager.listar_pdfs_na_pasta()
        self.total = len(pdfs)
        self.tui.iniciar_tempo()
        self.tui.atualizar_estado(total_pdfs=self.total)

        log.info("=" * 60)
        log.info("INICIANDO processamento em lote: %d PDFs encontrados", self.total)
        log.info("=" * 60)

        for i, caminho in enumerate(pdfs, 1):
            self.tui.atualizar_estado(
                arquivo_atual=caminho.name,
                processados=self.processados,
                ignorados=self.ignorados,
                renomeados=self.renomeados,
                erros=self.erros_count,
                tokens=self.deepseek.total_tokens,
                custo=self.deepseek.total_cost,
            )

            try:
                self.processar_pdf(caminho)
            except Exception as e:
                log.error("Erro fatal ao processar %s: %s", caminho.name, e)
                self.erros_count += 1

            # Pequena pausa entre documentos para não sobrecarregar
            time.sleep(0.3)

        # ── Finalização ──────────────────────────────────────────────
        self.cache.flush()
        self.output.regenerar_manifestos()

        tempo_total = time.time() - self.tui.tempo_inicio

        # Exibe resumo final
        if RICH_DISPONIVEL:
            self.tui.console.print(self.tui.renderizar())
        else:
            TerminalUI.imprimir_simples(
                total=self.total,
                proc=self.processados,
                ign=self.ignorados,
                ren=self.renomeados,
                err=self.erros_count,
                tokens=self.deepseek.total_tokens,
                custo=self.deepseek.total_cost,
                tempo=tempo_total,
            )

        log.info("=" * 60)
        log.info("PROCESSAMENTO CONCLUÍDO em %.1fs", tempo_total)
        log.info(
            "Total: %d | Processados: %d | Ignorados: %d | "
            "Renomeados: %d | Erros: %d",
            self.total, self.processados, self.ignorados,
            self.renomeados, self.erros_count,
        )
        log.info("Tokens: %d | Custo: $%.4f", self.deepseek.total_tokens, self.deepseek.total_cost)
        log.info("=" * 60)

    # ── Exclusão de duplicatas ──────────────────────────────────────

    def excluir_duplicatas(self, simular: bool = False) -> int:
        """Encontra e exclui PDFs duplicados (mesmo hash, nomes diferentes).

        Mantém a cópia com nome já catalogado (padrao ANO_INSTITUICAO_...),
        ou a que está registrada no banco com nome_novo.
        Exclui as demais.

        Args:
            simular: Se True, apenas lista, não exclui.

        Returns:
            Número de arquivos excluídos.
        """
        import re
        from collections import defaultdict
        from .utils import gerar_hash_sha256

        pdfs = self.hash_manager.listar_pdfs_na_pasta()
        hash_map = defaultdict(list)

        # Agrupa todos os PDFs por hash
        for caminho in pdfs:
            try:
                h = gerar_hash_sha256(caminho)
                hash_map[h].append(caminho)
            except Exception as e:
                log.warning("Erro ao gerar hash de %s: %s", caminho.name, e)

        excluidos = 0
        for h, arquivos in hash_map.items():
            if len(arquivos) <= 1:
                continue

            # Prioridade para decidir qual manter:
            # 1. Nome que segue o padrao ANO_INSTITUICAO_... (comeca com 4 digitos + _)
            # 2. Nome que esta registrado no banco como nome_novo
            # 3. Nome mais longo (mais descritivo)

            def prioridade(p: Path) -> int:
                nome = p.name
                if re.match(r'^\d{4}_', nome):
                    return 0  # maxima prioridade
                # Verifica se esta no banco como nome_novo
                registro = self.db.buscar_por_hash(h)
                if registro and registro.get("nome_novo") == nome:
                    return 1
                return 2  # menor prioridade

            arquivos.sort(key=prioridade)
            manter = arquivos[0]
            duplicatas = arquivos[1:]

            for dup in duplicatas:
                log.info("DUPLICATA: '%s' == '%s'", dup.name, manter.name)
                if not simular:
                    try:
                        dup.unlink()
                        excluidos += 1
                        log.info("  -> EXCLUIDO: %s", dup.name)
                    except OSError as e:
                        log.error("  -> ERRO ao excluir %s: %s", dup.name, e)
                else:
                    excluidos += 1
                    log.info("  -> [SIMULACAO] Seria excluido")

        log.info("Duplicatas excluidas: %d", excluidos)
        self.output.regenerar_manifestos()
        return excluidos

    # ── Modo Watch ──────────────────────────────────────────────────

    def iniciar_watch(self):
        """Inicia o monitoramento contínuo da pasta docs/."""
        log.info("=" * 60)
        log.info("MODO WATCH: Monitorando %s", DOCS_DIR)
        log.info("Pressione Ctrl+C para parar.")
        log.info("=" * 60)

        # Processa PDFs existentes primeiro
        self.processar_todos()

        # Inicia o monitor
        watcher = DocWatcher(callback=self.processar_pdf)
        watcher.iniciar()

        try:
            while True:
                watcher.processar_pendentes()
                time.sleep(1)
        except KeyboardInterrupt:
            log.info("Interrupção recebida. Finalizando...")
        finally:
            watcher.parar()
            self.cache.flush()
            self.output.regenerar_manifestos()
            self.db.close()
            log.info("Catalogador encerrado.")


# ── CLI ────────────────────────────────────────────────────────────────

def main():
    """Função principal da CLI."""
    parser = argparse.ArgumentParser(
        description="📚 Catalogador Inteligente de PDFs — Calculadoras de Enfermagem",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python -m automacoes.catalogador.main --once        # Processa todos os PDFs
  python -m automacoes.catalogador.main --watch        # Monitoramento contínuo
  python -m automacoes.catalogador.main --stats        # Apenas estatísticas
  python -m automacoes.catalogador.main --reprocess    # Força reprocessamento
        """,
    )
    parser.add_argument(
        "--once", action="store_true",
        help="Processa todos os PDFs da pasta docs/ e encerra",
    )
    parser.add_argument(
        "--watch", action="store_true",
        help="Monitoramento contínuo da pasta docs/ (Ctrl+C para sair)",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Exibe estatísticas do banco de dados",
    )
    parser.add_argument(
        "--reprocess", action="store_true",
        help="Força o reprocessamento de todos os PDFs (ignora cache)",
    )
    parser.add_argument(
        "--cleanup", action="store_true",
        help="Exclui PDFs duplicados (mesmo conteúdo, nomes diferentes)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Ativa logging DEBUG",
    )

    args = parser.parse_args()

    # Configura logging
    import logging
    nivel = logging.DEBUG if args.verbose else logging.INFO
    configurar_logging(level=nivel)

    # Modo padrão se nenhum argumento: --once
    if not any([args.once, args.watch, args.stats, args.reprocess, args.cleanup]):
        args.once = True

    pipeline = CatalogadorPipeline()

    try:
        if args.stats:
            _exibir_estatisticas(pipeline)
        elif args.cleanup:
            log.info("Limpando duplicatas...")
            excluidos = pipeline.excluir_duplicatas()
            print(f"\n  Duplicatas excluidas: {excluidos}")
        elif args.reprocess:
            log.info("Reprocessamento: limpando cache...")
            pipeline.cache.limpar()
            pipeline.processar_todos()
        elif args.watch:
            pipeline.iniciar_watch()
        elif args.once:
            pipeline.processar_todos()
    finally:
        pipeline.db.close()


def _exibir_estatisticas(pipeline: CatalogadorPipeline):
    """Exibe estatísticas do banco de dados."""
    db = pipeline.db
    contagem = db.contar_por_status()
    total_docs = sum(contagem.values())
    erros_list = db.listar_com_erro()

    print()
    print("=" * 60)
    print("  📊 ESTATÍSTICAS DO CATALOGADOR")
    print("=" * 60)
    print(f"  📄 Total de documentos: {total_docs}")
    for status, count in contagem.items():
        emoji = {"processado": "✅", "erro": "❌", "ignorado": "⏭️"}.get(status, "📋")
        print(f"  {emoji} {status}: {count}")
    print(f"  📁 Cache: {pipeline.cache.tamanho} entradas")

    if erros_list:
        print()
        print("  ❌ Documentos com erro:")
        for doc in erros_list[:10]:
            print(f"     • {doc.get('nome_original', '?')}: {doc.get('erro_msg', '?')}")

    print("=" * 60)
    print()


# ── Entry point ────────────────────────────────────────────────────────

if __name__ == "__main__":
    main()
