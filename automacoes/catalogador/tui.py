"""Interface de terminal profissional usando Rich.

Exibe:
    - Total de PDFs / Processados / Ignorados / Renomeados / Erros
    - Barra de progresso
    - Tempo restante e total
    - Tokens utilizados e custo estimado
    - Últimos documentos processados
"""

import time
from pathlib import Path
from typing import Optional

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import (
        Progress,
        SpinnerColumn,
        BarColumn,
        TextColumn,
        TimeElapsedColumn,
        TimeRemainingColumn,
    )
    from rich.layout import Layout
    from rich.live import Live
    from rich import box
    RICH_DISPONIVEL = True
except ImportError:
    RICH_DISPONIVEL = False

from .database import Database
from .config import TUI_REFRESH_RATE, TUI_MAX_RECENT
from .logger import get_logger

log = get_logger("tui")


class TerminalUI:
    """Interface de terminal Rich para o catalogador."""

    def __init__(self, db: Database):
        self.db = db
        self.console = Console() if RICH_DISPONIVEL else None

        # Estado
        self.total_pdfs = 0
        self.processados = 0
        self.ignorados = 0
        self.renomeados = 0
        self.erros = 0
        self.tempo_inicio = time.time()
        self.tokens_usados = 0
        self.custo_estimado = 0.0
        self.arquivo_atual = ""

    # ── Cabeçalho ───────────────────────────────────────────────────

    def renderizar(self) -> Panel:
        """Renderiza a TUI completa como um Panel do Rich."""
        if not RICH_DISPONIVEL:
            return Panel("Rich não instalado. Instale com: pip install rich")

        layout = Layout()
        layout.split_column(
            Layout(self._painel_status(), name="status"),
            Layout(self._painel_progresso(), name="progresso"),
            Layout(self._painel_metricas(), name="metricas"),
            Layout(self._painel_recentes(), name="recentes"),
        )
        return Panel(layout, title="📚 CATALOGADOR INTELIGENTE DE PDFs",
                     subtitle="Calculadoras de Enfermagem",
                     border_style="blue", padding=(1, 2))

    def _painel_status(self) -> Table:
        """Painel de status (contadores)."""
        tabela = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        tabela.add_column(style="bold cyan")
        tabela.add_column()
        tabela.add_column(style="bold cyan")
        tabela.add_column()

        total = self.total_pdfs
        proc = self.processados
        ign = self.ignorados
        ren = self.renomeados
        err = self.erros

        pct = f"({proc / total * 100:.0f}%)" if total > 0 else ""

        tabela.add_row(
            "📄 Total:", str(total),
            "✅ Processados:", f"{proc} {pct}",
        )
        tabela.add_row(
            "⏭️  Ignorados:", str(ign),
            "🏷️  Renomeados:", str(ren),
        )
        tabela.add_row(
            "❌ Erros:", f"[red]{err}[/red]" if err > 0 else str(err),
            "", "",
        )
        return tabela

    def _painel_progresso(self) -> str:
        """Linha de progresso simples."""
        if self.total_pdfs == 0:
            return "⏳ Aguardando documentos..."

        concluidos = self.processados + self.ignorados + self.erros
        pct = concluidos / self.total_pdfs * 100 if self.total_pdfs > 0 else 0
        barra_len = 30
        preenchido = int(barra_len * pct / 100)
        barra = "█" * preenchido + "░" * (barra_len - preenchido)

        tempo_decorrido = time.time() - self.tempo_inicio
        if concluidos > 0 and pct < 100:
            tempo_total_est = tempo_decorrido / (pct / 100)
            tempo_restante = tempo_total_est - tempo_decorrido
            tempo_str = f"⏱️ {tempo_decorrido:.0f}s / ~{tempo_restante:.0f}s"
        else:
            tempo_str = f"⏱️ {tempo_decorrido:.0f}s"

        atual = f" | 📋 {self.arquivo_atual}" if self.arquivo_atual else ""

        return f"{barra} {pct:.0f}%  {tempo_str}{atual}"

    def _painel_metricas(self) -> Table:
        """Painel de métricas (tokens, custo)."""
        tabela = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        tabela.add_column(style="bold yellow")
        tabela.add_column()
        tabela.add_column(style="bold yellow")
        tabela.add_column()

        tabela.add_row(
            "🤖 Tokens:", f"{self.tokens_usados:,}",
            "💰 Custo est.:", f"${self.custo_estimado:.4f} USD",
        )
        tabela.add_row(
            "⚡ Tempo total:", f"{time.time() - self.tempo_inicio:.0f}s",
            "📊 Requests:", str(self.processados),
        )
        return tabela

    def _painel_recentes(self) -> Table:
        """Painel de últimos documentos processados."""
        tabela = Table(box=box.SIMPLE, show_header=True, padding=(0, 1))
        tabela.add_column("Status", style="bold", width=4)
        tabela.add_column("Documento", style="cyan")

        recentes = self.db.listar_ultimos(TUI_MAX_RECENT)
        for doc in recentes:
            status = doc.get("status", "?")
            nome = doc.get("nome_novo") or doc.get("nome_original", "?")
            if len(nome) > 60:
                nome = nome[:57] + "..."

            if status == "processado":
                icon = "✅"
            elif status == "erro":
                icon = "❌"
            else:
                icon = "⏭️"

            tabela.add_row(icon, nome)

        if not recentes:
            tabela.add_row("", "[dim]Nenhum documento processado ainda[/dim]")

        return tabela

    # ── Métodos de atualização ──────────────────────────────────────

    def atualizar_estado(
        self,
        total_pdfs: int = None,
        processados: int = None,
        ignorados: int = None,
        renomeados: int = None,
        erros: int = None,
        tokens: int = None,
        custo: float = None,
        arquivo_atual: str = None,
    ):
        """Atualiza o estado da TUI."""
        if total_pdfs is not None:
            self.total_pdfs = total_pdfs
        if processados is not None:
            self.processados = processados
        if ignorados is not None:
            self.ignorados = ignorados
        if renomeados is not None:
            self.renomeados = renomeados
        if erros is not None:
            self.erros = erros
        if tokens is not None:
            self.tokens_usados = tokens
        if custo is not None:
            self.custo_estimado = custo
        if arquivo_atual is not None:
            self.arquivo_atual = arquivo_atual

    def iniciar_tempo(self):
        """Reseta o contador de tempo."""
        self.tempo_inicio = time.time()

    # ── Fallback sem Rich ───────────────────────────────────────────

    @staticmethod
    def imprimir_simples(
        total: int, proc: int, ign: int, ren: int, err: int,
        tokens: int, custo: float, tempo: float,
    ):
        """Imprime status no terminal sem Rich (fallback)."""
        print()
        print("=" * 60)
        print("  📚 CATALOGADOR INTELIGENTE DE PDFs")
        print("=" * 60)
        print(f"  📄 Total: {total}  |  ✅ Processados: {proc}")
        print(f"  ⏭️  Ignorados: {ign}  |  🏷️  Renomeados: {ren}")
        print(f"  ❌ Erros: {err}")
        print(f"  🤖 Tokens: {tokens:,}  |  💰 Custo: ${custo:.4f}")
        print(f"  ⚡ Tempo: {tempo:.0f}s")
        print("=" * 60)
