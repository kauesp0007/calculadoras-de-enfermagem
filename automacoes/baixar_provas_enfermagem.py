#!/usr/bin/env python3
"""Baixa provas publicas de concursos para enfermagem no Brasil.

O catalogo e obtido no PCI Concursos. Quando a fonte exibir Cloudflare
Turnstile, a verificacao deve ser resolvida manualmente no Chrome aberto pelo
programa. Este script nao tenta resolver nem contornar CAPTCHA.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "provas-pdf"
BASE = "https://www.pciconcursos.com.br"
CATEGORIES = {
    "enfermeiro": "/provas/enfermeiro",
    "tecnico": "/provas/tecnico-de-enfermagem",
}
FIELDS = (
    "id", "cargo", "ano", "orgao", "banca", "tipo", "arquivo",
    "pagina_fonte", "arquivo_fonte", "baixado_em", "status", "erro",
)


class CatalogParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[dict[str, Any]] = []
        self.row: dict[str, Any] | None = None
        self.in_td = False
        self.text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "tr" and data.get("data-url"):
            self.row = {"url": data["data-url"], "cells": []}
        elif tag == "td" and self.row is not None:
            self.in_td = True
            self.text = []

    def handle_data(self, data: str) -> None:
        if self.in_td:
            self.text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.row is not None and self.in_td:
            value = " ".join(" ".join(self.text).split())
            self.row["cells"].append(value)
            self.in_td = False
        elif tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def cli() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Baixa provas e gabaritos de enfermeiro e tecnico de enfermagem."
    )
    p.add_argument("--cargo", choices=("todos", "enfermeiro", "tecnico"), default="todos")
    p.add_argument("--de", dest="ano_inicio", type=int, default=2020, help="Ano inicial (padrao: 2020).")
    p.add_argument("--ate", dest="ano_fim", type=int, default=datetime.now().year)
    p.add_argument("--limite", type=int, default=10, help="Numero maximo de concursos novos.")
    p.add_argument("--paginas", type=int, default=10, help="Paginas por categoria a consultar.")
    p.add_argument("--saida", type=Path, default=DEFAULT_OUTPUT)
    p.add_argument("--somente-catalogar", action="store_true", help="Lista achados sem abrir o Chrome.")
    p.add_argument("--refazer-login", action="store_true", help="Abre novamente o Chrome normal para trocar a conta.")
    p.add_argument("--pausa", type=float, default=1.0)
    a = p.parse_args()
    if a.limite < 1 or a.paginas < 1:
        p.error("--limite e --paginas devem ser positivos")
    if a.ano_inicio > a.ano_fim:
        p.error("--de nao pode ser maior que --ate")
    return a


def get_html(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 BibliotecaProvasEnfermagem/1.0"})
    with urlopen(req, timeout=40) as response:
        return response.read().decode("utf-8", "replace")


def parse_row(row: dict[str, Any], categoria: str) -> dict[str, str] | None:
    cells = row["cells"]
    if len(cells) < 4:
        return None
    cargo, ano, orgao, banca = cells[:4]
    match = re.search(r"\b(19|20)\d{2}\b", ano)
    if not match:
        return None
    year = match.group(0)
    return {
        "id": row["url"].rstrip("/").split("/")[-1], "cargo": cargo,
        "ano": year, "orgao": orgao, "banca": banca, "categoria": categoria,
        "pagina_fonte": row["url"],
    }


def catalog(args: argparse.Namespace) -> list[dict[str, str]]:
    names = list(CATEGORIES) if args.cargo == "todos" else [args.cargo]
    found: dict[str, dict[str, str]] = {}
    for name in names:
        for page in range(1, args.paginas + 1):
            url = CATEGORIES[name] if page == 1 else f"{CATEGORIES[name]}/{page}"
            parser = CatalogParser()
            parser.feed(get_html(BASE + url))
            for row in parser.rows:
                item = parse_row(row, name)
                if item and args.ano_inicio <= int(item["ano"]) <= args.ano_fim:
                    found[item["id"]] = item
    return sorted(found.values(), key=lambda x: (x["ano"], x["id"]), reverse=True)


def slug(value: str, limit: int = 70) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").upper()
    return (value[:limit].rstrip("-") or "SEM-NOME")


def load_manifest(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return [{field: str(row.get(field, "")) for field in FIELDS} for row in data.get("arquivos", [])]
    except (OSError, ValueError, TypeError):
        return []


def save_manifest(output: Path, rows: list[dict[str, str]]) -> None:
    payload = {"atualizado_em": datetime.now(timezone.utc).isoformat(), "fonte": "PCI Concursos", "arquivos": rows}
    (output / "manifesto-provas.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with (output / "manifesto-provas.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def chrome_executable() -> Path:
    candidates = (
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    )
    found = next((path for path in candidates if path.exists()), None)
    if found is None:
        command = shutil.which("chrome") or shutil.which("chrome.exe")
        found = Path(command) if command else None
    if found is None:
        raise RuntimeError("Google Chrome nao foi encontrado neste computador")
    return found


def configure_login(force: bool = False) -> None:
    marker = ROOT / ".chrome-perfil-pci" / ".login-configurado"
    if marker.exists() and not force:
        return
    profile = ROOT / ".chrome-perfil-pci"
    profile.mkdir(parents=True, exist_ok=True)
    print("Abrindo o Chrome normal para configurar sua conta...")
    process = subprocess.Popen([
        str(chrome_executable()), f"--user-data-dir={profile}", BASE,
    ])
    print("Faca o login. Depois FECHE TODAS as janelas desse Chrome.")
    input("Quando o Chrome estiver fechado, pressione Enter: ")
    if process.poll() is None:
        raise RuntimeError("o Chrome ainda esta aberto; feche a janela antes de continuar")
    marker.write_text(datetime.now(timezone.utc).isoformat(), encoding="utf-8")


def browser(output: Path):
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
    except ImportError as exc:
        raise RuntimeError("Instale o Selenium: python -m pip install --user selenium") from exc
    options = Options()
    options.binary_location = str(chrome_executable())
    options.add_argument(f"--user-data-dir={ROOT / '.chrome-perfil-pci'}")
    options.add_argument("--start-maximized")
    options.add_experimental_option("prefs", {
        "download.default_directory": str(output.resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "plugins.always_open_pdf_externally": True,
    })
    return webdriver.Chrome(options=options)


def wait_for_login(driver) -> None:
    """Abre o PCI no Chrome persistente e deixa o login sob controle do usuario."""
    driver.get(BASE)
    print("\nO Google Chrome foi aberto com o perfil permanente do baixador.")
    print("Entre na sua conta no site, se necessario.")
    input("Quando terminar o login, volte ao terminal e pressione Enter para continuar: ")


def wait_download(output: Path, before: set[Path], timeout: int = 120) -> Path:
    end = time.time() + timeout
    while time.time() < end:
        current = set(output.glob("*"))
        new = [p for p in current - before if p.is_file() and not p.name.endswith(".crdownload")]
        partial = any(p.name.endswith(".crdownload") for p in current)
        if new and not partial:
            return max(new, key=lambda p: p.stat().st_mtime)
        time.sleep(1)
    raise TimeoutError("download nao terminou em 120 segundos")


def solve_captcha(driver) -> None:
    from selenium.webdriver.common.by import By
    captchas = driver.find_elements(By.CSS_SELECTOR, ".cf-turnstile")
    if captchas and captchas[0].is_displayed():
        print("  Resolva a verificacao no Chrome. Depois volte aqui e pressione Enter.")
        input()


def download_contest(driver, item: dict[str, str], output: Path, records: list[dict[str, str]]) -> int:
    from selenium.webdriver.common.by import By
    driver.get(item["pagina_fonte"])
    solve_captcha(driver)
    links = driver.find_elements(By.CSS_SELECTOR, '.prova-pdf-link[data-acao="baixar"]')
    downloaded = 0
    for link in links:
        source_name = link.get_attribute("data-arquivo") or "prova.pdf"
        kind = "GABARITO" if "gabar" in source_name.lower() else "PROVA"
        key = f'{item["id"]}:{source_name}'
        if any(row["id"] == key and row["status"] == "baixado" for row in records):
            continue
        solve_captcha(driver)
        before = set(output.glob("*"))
        row = {field: "" for field in FIELDS}
        row.update({field: item[field] for field in ("cargo", "ano", "orgao", "banca", "pagina_fonte")})
        row.update({"id": key, "tipo": kind, "arquivo_fonte": source_name, "status": "erro"})
        try:
            driver.execute_script("arguments[0].click();", link)
            received = wait_download(output, before)
            name = "-".join((item["ano"], slug(item["banca"], 30), slug(item["orgao"], 45), slug(item["cargo"], 55), kind)) + ".pdf"
            destination = output / name
            if destination.exists():
                destination = output / (destination.stem + "-" + slug(item["id"], 20) + ".pdf")
            received.replace(destination)
            if not destination.read_bytes()[:5] == b"%PDF-":
                raise ValueError("arquivo recebido nao e PDF")
            row.update({"arquivo": destination.name, "baixado_em": datetime.now(timezone.utc).isoformat(), "status": "baixado"})
            downloaded += 1
            print(f"  Baixado: {destination.name}")
        except Exception as exc:
            row["erro"] = str(exc)
            print(f"  Erro em {source_name}: {exc}")
        records.append(row)
        save_manifest(output, records)
        time.sleep(1)
    return downloaded


def main() -> int:
    args = cli()
    args.saida.mkdir(parents=True, exist_ok=True)
    manifest = args.saida / "manifesto-provas.json"
    records = load_manifest(manifest)
    known_contests = {row["id"].split(":", 1)[0] for row in records if row["status"] == "baixado"}
    driver = None
    if not args.somente_catalogar:
        try:
            configure_login(args.refazer_login)
            print("Abrindo o Google Chrome para login...")
            driver = browser(args.saida)
            wait_for_login(driver)
        except Exception as exc:
            print(f"Nao foi possivel abrir o Chrome: {exc}", file=sys.stderr)
            return 1
    try:
        print("Consultando o catalogo de provas...")
        items = [item for item in catalog(args) if item["id"] not in known_contests][:args.limite]
    except Exception as exc:
        print(f"Erro ao consultar catalogo: {exc}", file=sys.stderr)
        if driver is not None:
            driver.quit()
        return 1
    print(f"Encontrados {len(items)} concurso(s) novo(s).")
    for item in items:
        print(f'- {item["ano"]} | {item["banca"]} | {item["cargo"]}')
    if args.somente_catalogar or not items:
        if driver is not None:
            driver.quit()
        return 0
    total = 0
    try:
        for number, item in enumerate(items, 1):
            print(f'[{number}/{len(items)}] {item["cargo"]} - {item["orgao"]}')
            total += download_contest(driver, item, args.saida, records)
            time.sleep(args.pausa)
    except KeyboardInterrupt:
        print("Interrompido pelo usuario; downloads concluidos foram preservados.")
    except Exception as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1
    finally:
        if driver is not None:
            driver.quit()
    print(f"Concluido: {total} arquivo(s) novo(s) em {args.saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
