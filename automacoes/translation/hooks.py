"""Ganchos de integração pós-tradução — Etapa 3.

- Registro no log_traducoes.txt (mesmo formato do tradutor legado).
- Build opcional do site (Tailwind + service worker), controlado pela
  variável de ambiente TRANSLATION_BUILD_APOS_SALVAR=1.
"""

import os
import subprocess
from datetime import datetime

from automacoes.translation import config, logger


def _build_habilitado():
    return os.getenv("TRANSLATION_BUILD_APOS_SALVAR", "0").strip() == "1"


def rodar_build():
    """Executa o build do site (Tailwind minificado + gerar-sw)."""
    comandos = [
        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        "node gerar-sw.js",
    ]
    for comando in comandos:
        logger.info(f"Build: {comando}")
        try:
            subprocess.run(
                comando, shell=True, check=True, cwd=str(config.PASTA_PROJETO)
            )
        except subprocess.CalledProcessError as e:
            logger.aviso(f"Comando de build falhou: {comando} ({e})")


def apos_salvar(arquivo, idioma_destino, caminho_saida):
    """Registra a tradução no log e roda o build quando habilitado."""
    try:
        linha_log = (
            f"[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] "
            f"HTML traduzido (v2): '{arquivo}' | Idioma alvo: "
            f"'{idioma_destino}' | Destino: '{caminho_saida}'\n"
        )
        with open(
            config.PASTA_PROJETO / "log_traducoes.txt", "a", encoding="utf-8"
        ) as arquivo_log:
            arquivo_log.write(linha_log)
    except OSError as e:
        logger.aviso(f"Erro ao escrever log_traducoes.txt: {e}")

    if _build_habilitado():
        logger.info("TRANSLATION_BUILD_APOS_SALVAR=1 → executando build.")
        rodar_build()
