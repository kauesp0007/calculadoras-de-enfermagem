"""Geração de relatório final da auditoria SEO."""

import csv
from datetime import datetime
from pathlib import Path
from typing import Optional

from .config import LOGS_DIR
from .logger import get_logger

log = get_logger("relatorio")


class RelatorioAuditoria:
    """Acumula e gera relatórios da auditoria SEO."""

    def __init__(self):
        self.inicio = datetime.now()
        self.total_htmls = 0
        self.auditados = 0
        self.ignorados = 0
        self.sem_alteracoes = 0
        self.corrigidos = 0
        self.erros = 0

        # Contadores por tipo
        self.canonicals_corrigidos = 0
        self.canonicals_adicionados = 0
        self.og_urls_corrigidos = 0
        self.twitter_urls_corrigidos = 0
        self.twitter_urls_adicionados = 0
        self.hreflangs_corrigidos = 0
        self.hreflangs_adicionados = 0
        self.jsonlds_corrigidos = 0

        # Detalhes
        self.detalhes: list[dict] = []
        self.erros_lista: list[str] = []

    def registrar(self, plano, hash_antes: str, hash_depois: str,
                  sucesso: bool = True, erro_msg: str = ""):
        """Registra o resultado do processamento de um arquivo."""
        self.total_htmls += 1

        if not plano.tem_alteracoes:
            self.sem_alteracoes += 1
        else:
            self.auditados += 1
            if sucesso:
                self.corrigidos += 1
                self.canonicals_corrigidos += 1 if plano.canonical_corrigir else 0
                self.canonicals_adicionados += 1 if plano.canonical_adicionar else 0
                self.og_urls_corrigidos += 1 if plano.og_url_corrigir else 0
                self.twitter_urls_corrigidos += 1 if plano.twitter_url_corrigir else 0
                self.twitter_urls_adicionados += 1 if plano.twitter_url_adicionar else 0
                self.hreflangs_corrigidos += len(plano.hreflangs_corrigir)
                self.hreflangs_adicionados += len(plano.hreflangs_adicionar)
                self.jsonlds_corrigidos += 1 if plano.jsonld_campos else 0
            else:
                self.erros += 1
                self.erros_lista.append(f"{plano.caminho.name}: {erro_msg}")

        self.detalhes.append({
            "arquivo": str(plano.caminho.relative_to(plano.caminho.parent.parent))
                       if plano.caminho else "",
            "hash_antes": hash_antes[:12],
            "hash_depois": hash_depois[:12],
            "alterado": "SIM" if plano.tem_alteracoes else "NAO",
            "sucesso": "OK" if sucesso else "ERRO",
            "canonical": "C" if plano.canonical_corrigir else ("A" if plano.canonical_adicionar else "-"),
            "og_url": "C" if plano.og_url_corrigir else "-",
            "twitter_url": "C" if plano.twitter_url_corrigir else ("A" if plano.twitter_url_adicionar else "-"),
            "hreflang": f"C:{len(plano.hreflangs_corrigir)}/A:{len(plano.hreflangs_adicionar)}",
            "jsonld": "C" if plano.jsonld_campos else "-",
            "erro": erro_msg[:80] if erro_msg else "",
        })

    def gerar_csv(self, caminho: Optional[Path] = None):
        """Gera relatório CSV detalhado."""
        caminho = caminho or LOGS_DIR / "auditor_relatorio.csv"
        with open(caminho, "w", encoding="utf-8-sig", newline="") as f:
            campos = ["arquivo", "hash_antes", "hash_depois", "alterado",
                       "sucesso", "canonical", "og_url", "twitter_url",
                       "hreflang", "jsonld", "erro"]
            writer = csv.DictWriter(f, fieldnames=campos)
            writer.writeheader()
            writer.writerows(self.detalhes)
        log.info("Relatório CSV: %s", caminho)

    def gerar_txt(self, caminho: Optional[Path] = None):
        """Gera relatório TXT legível."""
        caminho = caminho or LOGS_DIR / "auditor_relatorio.txt"
        tempo = (datetime.now() - self.inicio).total_seconds()

        linhas = [
            "=" * 65,
            "  RELATÓRIO DE AUDITORIA SEO",
            f"  Data: {self.inicio.strftime('%Y-%m-%d %H:%M:%S')}",
            f"  Tempo total: {tempo:.1f}s",
            "=" * 65,
            "",
            f"  Total de HTMLs escaneados:  {self.total_htmls}",
            f"  Auditados (com alterações):  {self.auditados}",
            f"  Sem alterações (já ok):      {self.sem_alteracoes}",
            f"  Corrigidos com sucesso:       {self.corrigidos}",
            f"  Erros:                        {self.erros}",
            "",
            "  --- Correções por tipo ---",
            f"  Canonicals corrigidos:        {self.canonicals_corrigidos}",
            f"  Canonicals adicionados:       {self.canonicals_adicionados}",
            f"  og:url corrigidos:            {self.og_urls_corrigidos}",
            f"  twitter:url corrigidos:       {self.twitter_urls_corrigidos}",
            f"  twitter:url adicionados:      {self.twitter_urls_adicionados}",
            f"  Hreflangs corrigidos:         {self.hreflangs_corrigidos}",
            f"  Hreflangs adicionados:        {self.hreflangs_adicionados}",
            f"  JSON-LD corrigidos:           {self.jsonlds_corrigidos}",
            "",
        ]

        if self.erros_lista:
            linhas.append("  --- ERROS ---")
            for err in self.erros_lista[:20]:
                linhas.append(f"  ❌ {err}")
            linhas.append("")

        linhas.append("=" * 65)
        linhas.append("  Fim do relatório.")
        linhas.append("=" * 65)

        with open(caminho, "w", encoding="utf-8") as f:
            f.write("\n".join(linhas))
        log.info("Relatório TXT: %s", caminho)
