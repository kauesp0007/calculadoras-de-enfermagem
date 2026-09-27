#!/usr/bin/env python3
"""
Reconstrói os formulários Premium traduzidos EN/ES a partir dos formulários
canônicos PT-BR usando a memória de tradução v2 já versionada no repositório.

Regra de segurança:
- nunca usa um shell Premium como fonte;
- nunca copia conteúdo PT-BR para EN/ES;
- só substitui o destino quando a tradução estrutural é validada;
- preserva as rotas/SEO/hreflang/fontes pelos managers do tradutor v2.
"""

from pathlib import Path
import os
import sys
import tempfile
import requests

ROOT = Path(__file__).resolve().parent.parent

FORMULARIOS = [
    "formulario_bishop.html",
    "formulario_bps.html",
    "formulario_cam.html",
    "formulario_capurro.html",
    "formulario_carrinho.html",
    "formulario_de_fugulin.html",
    "formulario_escala_cincinnati.html",
    "formulario_escala_curb65.html",
    "formulario_escala_de_downton.html",
    "formulario_escala_de_elpo.html",
    "formulario_escala_de_gosnell.html",
    "formulario_escala_de_hamilton.html",
    "formulario_escala_de_hendrich.html",
    "formulario_escala_de_humpty.html",
    "formulario_escala_de_johns.html",
    "formulario_escala_de_jouvet.html",
    "formulario_escala_de_lachs.html",
    "formulario_escala_de_lanss.html",
    "formulario_escala_de_meows.html",
    "formulario_escala_de_news.html",
    "formulario_escala_de_nips.html",
    "formulario_escala_de_perroca.html",
    "formulario_meem.html",
    "formulario_morse.html",
]

IDIOMAS = ("en", "es")


def is_shell(path: Path) -> bool:
    if not path.exists():
        return False
    html = path.read_text(encoding="utf-8")
    return (
        'id="premium-content-placeholder"' in html
        and "premium-content-loader.js" in html
    )


def main() -> int:
    sys.path.insert(0, str(ROOT))

    from automacoes.translation import orchestrator

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        print("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes; não é seguro reconstruir a partir de shells.")
        return 2

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/json",
    }

    temp_dir = Path(tempfile.mkdtemp(prefix="premium-form-sources-"))

    def carregar_fonte_privada(nome: str) -> Path:
        url = f"{supabase_url}/rest/v1/premium_content_pages"
        params = {"select": "content", "path": f"eq.{nome}", "limit": "1"}
        response = requests.get(url, params=params, headers=headers, timeout=60)
        response.raise_for_status()
        rows = response.json()
        content = rows[0].get("content") if rows else None
        if not content or "premium-content-placeholder" in content:
            raise RuntimeError(f"conteúdo privado completo ausente para {nome}")
        destino = temp_dir / nome
        destino.write_text(content, encoding="utf-8")
        return destino

    total = 0
    changed = 0
    failures = []

    for nome in FORMULARIOS:
        try:
            fonte = carregar_fonte_privada(nome)
        except Exception as exc:
            failures.append(f"fonte privada {nome}: {exc}")
            continue

        for idioma in IDIOMAS:
            destino = ROOT / idioma / nome
            total += 1

            if destino.exists() and not is_shell(destino):
                print(f"SKIP completo: {destino.relative_to(ROOT)}")
                continue

            print(f"TRANSLATE: {nome} -> {idioma}")
            try:
                resultado = orchestrator.traduzir_arquivo(
                    fonte,
                    idioma,
                    modo="real",
                    usar_memoria=True,
                    caminho_memoria=ROOT / "automacoes/translation/cache/traducao_memoria.sqlite",
                    pasta_saida=str(ROOT / idioma),
                )

                if not resultado.get("estrutura_ok"):
                    failures.append(
                        f"{idioma}/{nome}: validação estrutural falhou: "
                        f"{resultado.get('problemas')}"
                    )
                    continue

                saida = resultado.get("caminho_saida")
                if not saida or not Path(saida).exists():
                    failures.append(f"{idioma}/{nome}: arquivo traduzido não foi gravado")
                    continue

                if is_shell(Path(saida)):
                    failures.append(f"{idioma}/{nome}: resultado continua sendo shell Premium")
                    continue

                changed += 1
                print(
                    f"OK: {idioma}/{nome} | "
                    f"{resultado.get('unidades_total')} unidades | "
                    f"{resultado.get('unidades_em_cache')} em cache | "
                    f"{resultado.get('unidades_novas')} novas"
                )
            except Exception as exc:
                failures.append(f"{idioma}/{nome}: {exc}")

    print(f"PROCESSADOS: {total}; RECONSTRUÍDOS: {changed}")

    if failures:
        print("FALHAS:")
        for item in failures:
            print(f"  - {item}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
