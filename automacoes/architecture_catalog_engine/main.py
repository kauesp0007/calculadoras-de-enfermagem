"""Architecture Catalog Engine (ACE) v1.0 — Documentacao completa da arquitetura.
NUNCA modifica arquivos. Saida: CATALOGO_DA_ARQUITETURA_ESTRUTURAL/
"""
import re, json as jmod, time as tmod
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUT = BASE_DIR / "CATALOGO_DA_ARQUITETURA_ESTRUTURAL"
TXTO = OUT / "ARQUITETURA_DO_PROJETO.txt"
MDO = OUT / "ARQUITETURA_DO_PROJETO.md"
LANGS = {"en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"}
SKIP = {".git",".github",".vscode","__pycache__",".ai","node_modules","logs","temp","automacoes",
        "CATALOGO_DO_SITE","CATALOGO_DE_IDENTIDADE_VISUAL","CATALOGO_SEO_METAS_HEAD",
        "CATALOGO_DA_ARQUITETURA_ESTRUTURAL","CATALOGO_DE_ESTRUTURA_FISICA"}

def scan():
    r={"html":[],"css":[],"js":[],"json":[],"img":[],"font":[],"other":[]}
    for root,dirs,files in BASE_DIR.walk():
        dirs[:]=[d for d in dirs if d not in SKIP and not d.startswith(".")]
        for fn in files:
            if fn.startswith("."): continue
            fp=Path(root)/fn; e=fp.suffix.lower()
            if e in {".html",".htm"}: r["html"].append(fp)
            elif e==".css": r["css"].append(fp)
            elif e in {".js",".mjs",".cjs"}: r["js"].append(fp)
            elif e==".json": r["json"].append(fp)
            elif e in {".webp",".png",".jpg",".jpeg",".gif",".svg",".ico"}: r["img"].append(fp)
            elif e in {".woff",".woff2",".ttf",".otf",".eot"}: r["font"].append(fp)
            else: r["other"].append(fp)
    return r

def _re1(pat,txt):
    m=re.search(pat,txt,re.I); return m.group(1).strip() if m else None

def analyze_html(fp):
    try: c=fp.read_text(encoding="utf-8",errors="replace")
    except: return None
    rel=str(fp.relative_to(BASE_DIR)); parts=Path(rel).parts
    lang="pt"
    if len(parts)>=2 and parts[0] in LANGS: lang=parts[0]
    elif parts[0] in ("blog","conta"): lang="pt"
    loc="raiz" if len(parts)==1 else (f"idioma/{parts[0]}" if parts[0] in LANGS else parts[0])
    hm=re.search(r'<head[^>]*>(.*?)</head>',c,re.DOTALL|re.I); head=hm.group(1) if hm else ""
    css=[]; [css.append(m.group(1)) for m in re.finditer(r'href=["\']([^"\']*\.css[^"\']*)["\']',head,re.I) if m.group(1) not in css]
    js=[]; [js.append({"s":m.group(1),"d":"defer" in m.group(0),"a":"async" in m.group(0)}) for m in re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']',c,re.I)]
    imgs=[]; [imgs.append({"s":m.group(1),"a":_re1(r'alt=["\']([^"\']*)["\']',m.group(0)) or ""}) for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']',c,re.I)]
    fonts=set(); [fonts.add(m.group(1).strip().split(",")[0].strip().strip("'").strip('"')) for m in re.finditer(r"font-family:\s*['\"]?([^'\"\}]+)['\"]?",head+c,re.I)]
    jsons=[]; [jsons.append(m.group(1)) for m in re.finditer(r'fetch\(["\']([^"\']+\.json[^"\']*)["\']',c,re.I)]
    mods=[]
    if 'menu-global.html' in c: mods.append("menu-global")
    if 'footer.html' in c: mods.append("footer")
    if '_language_selector.html' in c: mods.append("lang-selector")
    if 'global-body-elements.html' in c: mods.append("body-elements")
    tpl="fugulin" if 'fugulin-card' in c else ("login" if 'login-card' in c else ("blog" if 'article' in c.lower() else "padrao"))
    il=sorted(set(m.group(1).split("?")[0].split("#")[0] for m in re.finditer(r'href=["\'](/[^"\']+)["\']',c) if not m.group(1).startswith("//")))
    el=sorted(set(m.group(1) for m in re.finditer(r'href=["\'](https?://[^"\']+)["\']',c)))
    evts=sorted(set(ev for ev in ["DOMContentLoaded","load","click","submit","scroll","resize","change","keyup","keydown"] if ev in c))
    return {"f":rel,"n":fp.name,"lang":lang,"loc":loc,"size":round(len(c)/1024,1),"css":css,"js":js,"img":imgs,"fonts":sorted(fonts),"json":jsons,
            "mods":mods,"tpl":tpl,"il":il,"el":el,"bc":"Breadcrumb" in c,"title":_re1(r'<title>([^<]+)</title>',c),
            "h1":len(re.findall(r'<h1[>\s]',c,re.I)),"imgn":len(imgs),"schema":'ld+json' in c,
            "pre":len(re.findall(r'rel=["\']preload["\']',head)),"fb":"firebase" in c.lower(),
            "ga":"gtag" in c or "analytics" in c.lower(),"ads":"adsbygoogle" in c,"evts":evts}

def analyze_js(fp):
    try: c=fp.read_text(encoding="utf-8",errors="replace")
    except: return None
    rel=str(fp.relative_to(BASE_DIR))
    im=[]; [im.append(m.group(1)) for m in re.finditer(r'import\s+.*?from\s+["\']([^"\']+)["\']',c,re.I)]
    ex=[]; [ex.append(m.group(3)) for m in re.finditer(r'export\s+(default\s+)?(class|function|const|let|var|async\s+function)\s+(\w+)',c)]
    fc=[]; [fc.append(m.group(1)) for m in re.finditer(r'fetch\(["\']([^"\']+)["\']',c)]
    ap=[u for u in fc if u.startswith("/") and not u.startswith("//")]
    return {"f":rel,"n":fp.name,"size":round(len(c)/1024,1),"im":sorted(set(im)),"ex":sorted(set(ex)),"fc":fc,"ap":ap}

def analyze_css(fp):
    try: c=fp.read_text(encoding="utf-8",errors="replace")
    except: return None
    rel=str(fp.relative_to(BASE_DIR))
    im=[]; [im.append(m.group(1)) for m in re.finditer(r'@import\s+(?:url\(["\']?)?([^"\')\s]+)',c,re.I)]
    return {"f":rel,"n":fp.name,"size":round(len(c)/1024,1),"im":im}

def analyze_json(fp):
    rel=str(fp.relative_to(BASE_DIR))
    try:
        c=fp.read_text(encoding="utf-8",errors="replace"); d=jmod.loads(c)
        if isinstance(d,dict): sz=len(d); ks=list(d.keys())[:10]
        elif isinstance(d,list): sz=len(d); ks=[f"[{i}]" for i in range(min(3,len(d)))]
        else: sz=0; ks=[]
    except: sz=0; ks=[]
    return {"f":rel,"n":fp.name,"size":round(fp.stat().st_size/1024,1),"items":sz,"keys":ks}

def run():
    t0=tmod.perf_counter()
    print("="*50); print("  Architecture Catalog Engine (ACE)"); print("="*50)
    OUT.mkdir(parents=True,exist_ok=True)
    print("[1/3] Scanning..."); a=scan()
    print(f"  HTML:{len(a['html']):,} CSS:{len(a['css'])} JS:{len(a['js'])} JSON:{len(a['json'])} Img:{len(a['img']):,} Fonts:{len(a['font'])}")
    print("[2/3] Analyzing...")
    hd=[x for x in (analyze_html(f) for f in a["html"]) if x]
    jd=[x for x in (analyze_js(f) for f in a["js"]) if x]
    cd=[x for x in (analyze_css(f) for f in a["css"] if f.exists()) if x]
    jn=[x for x in (analyze_json(f) for f in a["json"]) if x]
    print(f"  {len(hd)} HTML, {len(jd)} JS, {len(cd)} CSS, {len(jn)} JSON")
    print("[3/3] Generating reports...")

    # Stats
    by_lang=Counter(h["lang"] for h in hd); by_tpl=Counter(h["tpl"] for h in hd); by_loc=Counter(h["loc"] for h in hd)
    css_u=Counter(); [css_u.update(h["css"]) for h in hd]
    js_u=Counter(); [js_u.update(s["s"] for h in hd for s in h["js"])]
    mod_u=Counter(); [mod_u.update(h["mods"]) for h in hd]
    img_u=Counter(); [img_u.update(i["s"] for h in hd for i in h["img"])]
    font_u=Counter(); [font_u.update(h["fonts"]) for h in hd]
    total_il=sum(len(h["il"]) for h in hd); total_el=sum(len(h["el"]) for h in hd)
    total_edges=sum(len(h["css"])+len(h["js"])+len(h["img"])+len(h["mods"]) for h in hd)

    # Reuse
    reuse=defaultdict(list)
    for h in hd:
        for m in h["mods"]: reuse[f"mod:{m}"].append(h["f"])
        if h["fb"]: reuse["API:Firebase"].append(h["f"])
        if h["ga"]: reuse["API:Analytics"].append(h["f"])
        if h["ads"]: reuse["API:Ads"].append(h["f"])
        if h["schema"]: reuse["FEAT:Schema"].append(h["f"])
        if h["bc"]: reuse["COMP:Breadcrumb"].append(h["f"])

    # TXT
    txt=[]; H,S="="*70,"-"*70
    txt.append(H); txt.append("  ARQUITETURA DO PROJETO — Calculadoras de Enfermagem")
    txt.append("  Architecture Catalog Engine (ACE) v1.0"); txt.append(H); txt.append("")

    for title, content in [
        ("1. VISAO GERAL", [f"Paginas HTML: {len(hd):,}", f"CSS: {len(cd)}", f"JavaScript: {len(jd)}", f"JSON: {len(jn)}", f"Imagens: {len(a['img']):,}", f"Fontes: {len(a['font'])}", f"Arestas dependencias: {total_edges:,}"]),
        ("2. HTML POR IDIOMA", [f"{l}: {c:,}" for l,c in by_lang.most_common()]),
        ("3. MODULOS HTML REUTILIZADOS", [f"{m:<25} {c:>5}x" for m,c in mod_u.most_common()]),
        ("4. CSS — TOP DEPENDENCIAS", [f"{c:>5}x  {css}" for css,c in css_u.most_common(12)]),
        ("5. JAVASCRIPT — TOP DEPENDENCIAS", [f"{c:>5}x  {js}" for js,c in js_u.most_common(20)]),
        ("6. JSON — CATALOGO", [f"{j['f']:<50} {j['size']:>6}KB items:{j['items']:,}" for j in jn[:25]]),
        ("7. IMAGENS MAIS USADAS", [f"{c:>5}x  {img}" for img,c in img_u.most_common(20)]),
        ("8. FONTES", [f"{c:>5}x  {f}" for f,c in font_u.most_common(10)]),
        ("9. MAPA DE DEPENDENCIAS", [f"Arestas totais: {total_edges:,}"] + [f"  {len(h.get('css',[]))+len(h.get('js',[]))+len(h.get('img',[]))+len(h.get('mods',[])):>4} deps  {h['f']}" for h in sorted(hd, key=lambda h: len(h.get("css",[]))+len(h.get("js",[]))+len(h.get("img",[]))+len(h.get("mods",[])), reverse=True)[:20]]),
        ("10. NAVEGACAO", [f"Links internos: {total_il:,}", f"Links externos: {total_el:,}", f"Com breadcrumb: {sum(1 for h in hd if h['bc']):,}"]),
        ("11. FLUXO DE EXECUCAO", [f"Preloads totais: {sum(h['pre'] for h in hd):,}", f"H1 detectados: {sum(h['h1'] for h in hd):,}", f"Imagens totais: {sum(h['imgn'] for h in hd):,}"]),
        ("12. COMPONENTES REUTILIZADOS", [f"{comp:<30} {len(files):>5}x" for comp,files in sorted(reuse.items(), key=lambda x: len(x[1]), reverse=True)[:15]]),
        ("13. APIs", [f"Firebase: {sum(1 for h in hd if h['fb'])} paginas", f"Analytics: {sum(1 for h in hd if h['ga'])} paginas", f"Ads: {sum(1 for h in hd if h['ads'])} paginas", f"Schema.org: {sum(1 for h in hd if h['schema'])} paginas"]),
        ("14. TEMPLATES", [f"{t}: {c}" for t,c in by_tpl.most_common()]),
        ("15. RESUMO EXECUTIVO", [f"Paginas: {len(hd):,}", f"CSS: {len(cd)}", f"JS: {len(jd)}", f"JSON: {len(jn)}", f"Imagens: {len(a['img']):,}", f"Fontes: {len(a['font'])}", f"Modulos HTML: {len(mod_u)}", f"Componentes: {len(reuse)}", f"Arestas: {total_edges:,}", f"Links internos: {total_il:,}", f"Templates: {len(by_tpl)}"]),
    ]:
        txt.append(S); txt.append(f"  {title}"); txt.append(S)
        for line in content: txt.append(f"  {line}")
        txt.append("")

    txt.append(H); txt.append("  Fim. ACE v1.0 — Apenas leitura"); txt.append(H)
    TXTO.write_text("\n".join(txt), encoding="utf-8")

    # MD
    md=[]
    md.append("# Arquitetura do Projeto"); md.append("")
    md.append("**ACE v1.0**"); md.append("")
    md.append("## Visao Geral"); md.append("")
    md.append("| Metrica | Valor |"); md.append("|---|---|")
    md.append(f"| Paginas | **{len(hd):,}** |"); md.append(f"| CSS | {len(cd)} |"); md.append(f"| JS | {len(jd)} |")
    md.append(f"| JSON | {len(jn)} |"); md.append(f"| Imagens | {len(a['img']):,} |"); md.append(f"| Arestas | {total_edges:,} |")
    md.append("")
    md.append("## Modulos HTML"); md.append("")
    md.append("| Modulo | Uso |"); md.append("|---|---|")
    for m,c in mod_u.most_common(): md.append(f"| {m} | {c}x |")
    md.append("")
    md.append("## JavaScript — Top Dependencias"); md.append("")
    md.append("| Script | Uso |"); md.append("|---|---|")
    for js,c in js_u.most_common(15): md.append(f"| `{js}` | {c}x |")
    md.append("")
    md.append("## Componentes Reutilizados"); md.append("")
    md.append("| Componente | Arquivos |"); md.append("|---|---|")
    for comp,files in sorted(reuse.items(), key=lambda x: len(x[1]), reverse=True)[:12]: md.append(f"| {comp} | **{len(files)}** |")
    md.append("")
    md.append("## Resumo Executivo"); md.append("")
    md.append("| Metrica | Valor |"); md.append("|---|---|")
    md.append(f"| Paginas | **{len(hd):,}** |"); md.append(f"| Modulos HTML | {len(mod_u)} |")
    md.append(f"| Componentes | {len(reuse)} |"); md.append(f"| Arestas | {total_edges:,} |")
    md.append(f"| Links internos | {total_il:,} |")
    md.append(""); md.append("---"); md.append("*ACE v1.0*")
    MDO.write_text("\n".join(md), encoding="utf-8")

    print(f"  [OK] {TXTO}"); print(f"  [OK] {MDO}")
    print(f"  Tempo: {tmod.perf_counter()-t0:.2f}s")
    print(f"  {len(hd):,} paginas | {len(jd)} JS | {len(cd)} CSS | {len(jn)} JSON | {total_edges:,} arestas")

if __name__=="__main__": run()
