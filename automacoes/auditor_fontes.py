#!/usr/bin/env python3
from pathlib import Path
import re,csv,logging
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"relatorios"; OUT.mkdir(exist_ok=True)
LOGDIR=ROOT/"logs"; LOGDIR.mkdir(exist_ok=True)
logging.basicConfig(filename=LOGDIR/"auditor.log",level=logging.INFO)

IGNORE_DIRS={"downloads","biblioteca","blog",".git","node_modules","dist","output","out","__pycache__"}
IGNORE_FILES={"footer.html","menu-global.html","global-body-elements.html","downloads.html","menu-lateral.html","_language_selector.html","googlefc0a17cdd552164b.html"}

fa=Counter(); fonts=Counter(); css=Counter(); fontfiles=Counter()
pages=defaultdict(lambda:{"fonts":set(),"icons":set(),"css":set(),"fontfiles":set()})

re_css=re.compile(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)',re.I)
re_ff=re.compile(r'font-family\s*:\s*([^;"}]+)',re.I)
re_icon=re.compile(r'\bfa-([a-z0-9-]+)\b')
re_fontfile=re.compile(r'["\']([^"\']+\.(?:woff2?|ttf|otf|eot))["\']',re.I)

for p in ROOT.rglob("*.html"):
    if any(part in IGNORE_DIRS for part in p.parts): continue
    if p.name in IGNORE_FILES: continue
    try: txt=p.read_text(encoding="utf-8",errors="ignore")
    except: continue
    rel=str(p.relative_to(ROOT))
    for m in re_css.findall(txt):
        css[m]+=1; pages[rel]["css"].add(m)
    for m in re_ff.findall(txt):
        f=m.strip(" '\"")
        fonts[f]+=1; pages[rel]["fonts"].add(f)
    for m in re_icon.findall(txt):
        if m in ("solid","regular","brands"): continue
        icon="fa-"+m
        fa[icon]+=1; pages[rel]["icons"].add(icon)
    for m in re_fontfile.findall(txt):
        fontfiles[m]+=1; pages[rel]["fontfiles"].add(m)

def write_counter(path,title,c):
    with open(path,"w",encoding="utf-8") as f:
        f.write(title+"\n\n")
        for k,v in c.most_common():
            f.write(f"{k}: {v}\n")

write_counter(OUT/"fontes_utilizadas.txt","FONTES",fonts)
write_counter(OUT/"icones_fontawesome.txt","ICONES",fa)
write_counter(OUT/"css_utilizados.txt","CSS",css)
write_counter(OUT/"arquivos_fontes.txt","ARQUIVOS FONTES",fontfiles)

with open(OUT/"paginas_fontes.txt","w",encoding="utf-8") as f:
    for page,data in sorted(pages.items()):
        f.write(page+"\n")
        for k in ("fonts","icons","css","fontfiles"):
            f.write(f"  {k}: {', '.join(sorted(data[k])) or '-'}\n")
        f.write("\n")

with open(OUT/"resumo.csv","w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["Categoria","Item","Ocorrencias"])
    for name,c in [("Fonte",fonts),("Icone",fa),("CSS",css),("ArquivoFonte",fontfiles)]:
        for k,v in c.most_common():
            w.writerow([name,k,v])

print("Concluído.")
