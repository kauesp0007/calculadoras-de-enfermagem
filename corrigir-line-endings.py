# -*- coding: utf-8 -*-
"""
Restaura o line ending original (LF/CRLF) dos HTMLs modificados pela injeção
do anúncio pré-hero, preservando o bloco de anúncio. Usa o git HEAD como fonte
da verdade do line ending original de cada arquivo.
"""
import os
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
MARKER = "ANÚNCIO DISPLAY HORIZONTAL (PRÉ-HERO)".encode("utf-8")

SKIP_DIRS = {"node_modules", ".git", "backups-temporarios", "automacoes",
             ".github", "public", "js", "img", "fonts", "src", "supabase",
             "scripts", "conta", "governance", "knowledge", "downloads",
             "biblioteca", "blog", "blog-templates"}


def collect_injected():
    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(".html"):
                continue
            p = os.path.join(dirpath, fn)
            try:
                with open(p, "rb") as f:
                    if MARKER in f.read():
                        files.append(p)
            except OSError:
                continue
    return files


def original_is_crlf(rel):
    r = subprocess.run(["git", "show", "HEAD:" + rel],
                       capture_output=True)
    if r.returncode != 0:
        return None  # arquivo novo (não está no HEAD)
    return b"\r\n" in r.stdout


def main():
    files = collect_injected()
    fixed_crlf = 0
    fixed_lf = 0
    skipped = 0
    for path in files:
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        want_crlf = original_is_crlf(rel)
        if want_crlf is None:
            skipped += 1
            continue
        with open(path, "rb") as f:
            current = f.read()
        # normaliza para \n e converte para o alvo
        norm = current.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        target = norm.replace(b"\n", b"\r\n") if want_crlf else norm
        if target != current:
            with open(path, "wb") as f:
                f.write(target)
            if want_crlf:
                fixed_crlf += 1
            else:
                fixed_lf += 1
    print(f"Convertidos para CRLF: {fixed_crlf}")
    print(f"Convertidos para LF: {fixed_lf}")
    print(f"Arquivos novos (sem HEAD, mantidos): {skipped}")


if __name__ == "__main__":
    main()
