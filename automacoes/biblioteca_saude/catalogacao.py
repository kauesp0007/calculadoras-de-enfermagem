"""FASE 6 — Catalogação (spec §6, §7, §9, §12).

Enriquece o registro de cada documento EXTRACTED com metadados bibliográficos
(título, tipo documental, instituição, ano, especialidade, assuntos, profissões).

- 100% determinístico por heurística de nome + texto (sem IA nesta etapa).
- NUNCA inventa (§12): cada campo registra também a sua `origem`.
- O tipo documental fino e a análise semântica ficam para a FASE 9 (IA).
"""

import json
import re
import sys
from pathlib import Path

from .config import DOCUMENTOS_DIR, ENTRADA_DIR
from .ingestao import carregar_indice, salvar_indice

ANO_RE = re.compile(r"(?<!\d)(19|20)\d{2}(?!\d)")

# Palavras-chave → especialidade (primeira que casar vence)
ESPECIALIDADE_KEYWORDS = [
    ("obstetricia", ["parto", "nascimento", "nascimento", "obstetr", "gestacional"]),
    ("saude_mental", ["saude mental", "saúde mental"]),
    ("emergencia", ["classificacao de risco", "acolhimento", "emergencia", "urgencia"]),
    ("saude_coletiva", ["atencao basica", "atenção básica", "humaniza", "sus", "rede de producao", "clinica ampliada"]),
    ("gestao", ["trabalho", "gestao", "hospitalar", "formacao"]),
    ("enfermagem_medico_cirurgica", ["anamnese", "exame fisico", "propedeutica"]),
]

ASSUNTO_KEYWORDS = {
    "humanizacao": ["humaniza", "humanização", "acolhimento"],
    "politica_nacional_humanizacao": ["politica nacional de humanizacao", "pnh"],
    "parto_nascimento": ["parto", "nascimento"],
    "saude_mental": ["saude mental", "saúde mental"],
    "atencao_basica": ["atencao basica", "atenção básica"],
    "atencao_hospitalar": ["atencao hospitalar", "hospitalar"],
    "classificacao_risco": ["classificacao de risco"],
    "clinica_ampliada": ["clinica ampliada"],
    "rede_saude": ["rede de producao", "rede de saúde", "rede de saude"],
    "trabalho_saude": ["trabalho e redes", "trabalho em saude"],
    "anamnese_exame_fisico": ["anamnese", "exame fisico", "exame físico"],
}

PROFISSOES_DEFAULT = ["enfermagem", "saude_publica"]

# Estados que NUNCA devem ser catalogados (erro, revisão humana, OCR pendente)
NAO_CATALOGAVEIS = {"INGESTED", "REQUIRES_HUMAN_REVIEW", "ERROR"}


def _ler_registro(info: dict) -> dict:
    return json.loads((DOCUMENTOS_DIR / f"{info['id']}.json").read_text(encoding="utf-8"))


def _gravar_registro(reg: dict) -> None:
    (DOCUMENTOS_DIR / f"{reg['id']}.json").write_text(
        json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _titulo_legivel(nome: str) -> str:
    sem_ext = Path(nome).stem
    tokens = []
    for t in sem_ext.split("_"):
        tl = t.lower()
        if ANO_RE.fullmatch(t):
            continue  # ano
        if t.upper() == "MS":
            continue  # instituição
        if re.fullmatch(r"v\d+", tl):
            continue  # volume
        if tl.startswith("volume") and tl[len("volume"):].isdigit():
            continue  # volumeN
        tokens.append(t)
    titulo = " ".join(tokens).replace("-", " ")
    return titulo.strip().capitalize() or None


def _ano_do_nome(nome: str) -> int | None:
    m = ANO_RE.search(nome)
    return int(m.group()) if m else None


def _instituicao(nome: str, texto: str) -> str | None:
    if "MS" in nome.split("_") or re.search(r"minist[eé]rio da sa[uú]de", texto, re.IGNORECASE):
        return "Ministério da Saúde"
    return None


def _tipo_documental(nome: str) -> str:
    n = nome.lower()
    if "caderno" in n or "cadernos" in n:
        return "MANUAL"
    if "politica" in n:
        return "GUIDELINE"
    if "manual" in n:
        return "MANUAL"
    return "GOVERNMENT_DOCUMENT"


def _especialidades(nome: str, texto: str) -> list:
    fonte = (nome + " " + texto[:3000]).lower()
    espec = []
    for nome_esp, kws in ESPECIALIDADE_KEYWORDS:
        if any(k in fonte for k in kws) and nome_esp not in espec:
            espec.append(nome_esp)
    return espec or ["saude_coletiva"]


def _assuntos(nome: str, texto: str) -> list:
    fonte = (nome + " " + texto[:3000]).lower()
    return [a for a, kws in ASSUNTO_KEYWORDS.items() if any(k in fonte for k in kws)]


def executar(dry_run: bool = False, force: bool = False) -> dict:
    indice = carregar_indice()
    resumo = {"catalogados": [], "pulados": []}

    for nome, info in indice["documentos"].items():
        reg = _ler_registro(info)
        status = reg.get("status")
        if status in NAO_CATALOGAVEIS:
            resumo["pulados"].append(nome)
            continue
        if not force and status != "EXTRACTED":
            resumo["pulados"].append(nome)
            continue

        caminho = ENTRADA_DIR / nome
        texto_path = None
        if reg.get("texto_extraido_em"):
            texto_path = (Path("biblioteca_de_enfermagem_json") / reg["texto_extraido_em"])
        texto = texto_path.read_text(encoding="utf-8", errors="replace") if texto_path and texto_path.exists() else ""

        reg["titulo"] = _titulo_legivel(nome)
        reg["ano_publicacao"] = _ano_do_nome(nome)
        reg["instituicao"] = _instituicao(nome, texto)
        reg["tipo_documental"] = _tipo_documental(nome)
        reg["especialidade"] = _especialidades(nome, texto)
        reg["assuntos"] = _assuntos(nome, texto)
        reg["profissoes_relacionadas"] = PROFISSOES_DEFAULT
        reg["metadados_origem"] = "heuristica_nome_arquivo_texto"
        reg["status"] = "CATALOGED"

        resumo["catalogados"].append(nome)
        if not dry_run:
            _gravar_registro(reg)
            indice["documentos"][nome]["status"] = "CATALOGED"
            indice["documentos"][nome]["titulo"] = reg["titulo"]
            indice["documentos"][nome]["tipo_documental"] = reg["tipo_documental"]

    if not dry_run and resumo["catalogados"]:
        salvar_indice(indice)

    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    force = "--force" in sys.argv
    resumo = executar(dry_run=dry_run, force=force)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 6 — CATALOGAÇÃO] modo={modo}")
    print(f"  Catalogados : {len(resumo['catalogados'])}")
    for nome in resumo["catalogados"]:
        print(f"      - {nome}")
    print(f"  Pulados     : {len(resumo['pulados'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
