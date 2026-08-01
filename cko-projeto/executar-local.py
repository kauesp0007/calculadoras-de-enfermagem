#!/usr/bin/env python3
"""Servidor HTTP local restrito à pasta cko-projeto."""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
START_PAGE = "/03-templates/paginas/index.html"


class CKORequestHandler(SimpleHTTPRequestHandler):
    """Handler com charset previsível e cache desabilitado durante a revisão."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".csv": "text/csv; charset=utf-8",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve somente a pasta cko-projeto")
    parser.add_argument("--host", default="127.0.0.1", help="endereço local (padrão: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="porta (padrão: 8000; use 0 para automática)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    handler = partial(CKORequestHandler, directory=str(PROJECT_ROOT))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    host, port = server.server_address[:2]
    display_host = "localhost" if host in {"127.0.0.1", "0.0.0.0"} else host
    print("Projeto CKO disponível em:")
    print(f"  http://{display_host}:{port}{START_PAGE}")
    print("Pressione Ctrl+C para encerrar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
