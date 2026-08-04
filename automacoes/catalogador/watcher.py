"""Monitoramento contínuo da pasta docs/ usando watchdog.

Detecta automaticamente novos arquivos PDF e os encaminha
para o pipeline de processamento.
"""

import time
from pathlib import Path
from typing import Callable, Optional

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent

from .config import DOCS_DIR, WATCH_DEBOUNCE_SECONDS
from .utils import validar_extensao_pdf
from .logger import get_logger

log = get_logger("watcher")


class PDFHandler(FileSystemEventHandler):
    """Handler que processa eventos de criação/modificação de PDFs."""

    def __init__(self, callback: Callable[[Path], None]):
        """Inicializa o handler.

        Args:
            callback: Função a ser chamada com o Path do PDF detectado.
        """
        super().__init__()
        self.callback = callback
        self._pending: dict[str, float] = {}  # path → timestamp

    def on_created(self, event: FileCreatedEvent):
        """Chamado quando um arquivo é criado na pasta monitorada."""
        if event.is_directory:
            return

        caminho = Path(event.src_path)

        # Só processa PDFs
        if not caminho.suffix.lower() == ".pdf":
            return

        # Debounce: espera o arquivo terminar de ser copiado
        self._pending[str(caminho)] = time.time()

    def on_modified(self, event):
        """Chamado quando um arquivo é modificado."""
        if event.is_directory:
            return

        caminho = Path(event.src_path)
        if caminho.suffix.lower() == ".pdf":
            self._pending[str(caminho)] = time.time()

    def processar_pendentes(self):
        """Processa arquivos pendentes após o debounce.

        Deve ser chamado periodicamente (ex: via loop principal ou timer).
        """
        agora = time.time()
        processados = []

        for path_str, timestamp in list(self._pending.items()):
            if agora - timestamp >= WATCH_DEBOUNCE_SECONDS:
                caminho = Path(path_str)
                if caminho.exists() and validar_extensao_pdf(caminho):
                    log.info("Arquivo detectado: %s", caminho.name)
                    try:
                        self.callback(caminho)
                    except Exception as e:
                        log.error("Erro ao processar %s: %s", caminho.name, e)
                processados.append(path_str)

        for path_str in processados:
            del self._pending[path_str]


class DocWatcher:
    """Monitora a pasta docs/ em busca de novos PDFs."""

    def __init__(
        self,
        pasta: Optional[Path] = None,
        callback: Optional[Callable[[Path], None]] = None,
    ):
        """Inicializa o monitor.

        Args:
            pasta: Pasta a monitorar. Default: DOCS_DIR.
            callback: Função chamada para cada PDF detectado.
        """
        self.pasta = pasta or DOCS_DIR
        self.callback = callback or (lambda p: log.info("PDF detectado: %s", p.name))
        self._observer: Optional[Observer] = None
        self._handler: Optional[PDFHandler] = None
        self._running = False

    def iniciar(self):
        """Inicia o monitoramento da pasta."""
        if self._running:
            log.warning("Monitor já está em execução.")
            return

        if not self.pasta.exists():
            log.error("Pasta não encontrada: %s", self.pasta)
            return

        self._handler = PDFHandler(self.callback)
        self._observer = Observer()
        self._observer.schedule(self._handler, str(self.pasta), recursive=False)
        self._observer.start()
        self._running = True
        log.info("Monitoramento iniciado em: %s", self.pasta)

    def parar(self):
        """Para o monitoramento."""
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._observer = None
        self._running = False
        log.info("Monitoramento parado.")

    def processar_pendentes(self):
        """Processa arquivos em debounce (chamar periodicamente)."""
        if self._handler:
            self._handler.processar_pendentes()

    @property
    def rodando(self) -> bool:
        return self._running
