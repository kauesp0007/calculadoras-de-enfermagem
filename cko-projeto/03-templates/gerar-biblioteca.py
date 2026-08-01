#!/usr/bin/env python3
"""
gerar-biblioteca.py — renderiza um objeto CKO de biblioteca (02-bibliotecas/*.json)
em uma página HTML no shell de produção, idêntico ao padrão de biblioteca-seringa.html.

Uso:
    python3 gerar-biblioteca.py ../02-bibliotecas/curativos.json ./paginas/
    python3 gerar-biblioteca.py --all ../02-bibliotecas ./paginas/
"""
import json, sys, os, html, glob

BASE = "https://www.calculadorasdeenfermagem.com.br"
def e(s): return html.escape(str(s), quote=True)

def chips(items, style):
    return "".join(f'<span class="chip" style="{style}">{e(x)}</span>' for x in items if x)

def li(items, fmt=lambda x: e(x)):
    return "".join(f"<li>{fmt(x)}</li>" for x in items)

def render_characteristics(d):
    ex = d.get("exclusiveModules", []); ch = d.get("characteristics", {})
    out = []
    for mod in ex:
        val = ch.get(mod)
        if val is None: continue
        out.append(f'<h3 class="sub">{e(mod)}</h3>')
        if isinstance(val, dict):
            rows = "".join(f"<tr><td><strong>{e(k)}</strong></td><td>{e(v) if not isinstance(v,(dict,list)) else e(json.dumps(v,ensure_ascii=False))}</td></tr>" for k,v in val.items())
            out.append(f'<div style="overflow-x:auto"><table class="data"><tbody>{rows}</tbody></table></div>')
        elif isinstance(val, list):
            out.append(f'<ul class="clean">{li(val)}</ul>')
        else:
            out.append(f'<p>{e(val)}</p>')
    return "\n".join(out) or "<p>Sem características específicas cadastradas.</p>"


def render_specs(d):
    spec=(d.get("catalog") or {}).get("specifications") or {}
    ext=d.get("extensions") or {}
    merged={**spec, **ext}
    merged={k:v for k,v in merged.items() if v not in (None,"",[],{})}
    if not merged: return ""
    def cell(v):
        if isinstance(v,list): return e(", ".join(map(str,v)))
        if isinstance(v,dict): return e(json.dumps(v,ensure_ascii=False))
        return e(v)
    rows="".join(f"<tr><td><strong>{e(k)}</strong></td><td>{cell(v)}</td></tr>" for k,v in merged.items())
    return f'<h3 class="sub">Ficha técnica</h3><div style="overflow-x:auto"><table class="data"><tbody>{rows}</tbody></table></div>'

def render_risk(rk):
    if not rk: return ""
    classes=[("ANVISA",rk.get("anvisaClass")),("FDA",rk.get("fdaClass")),("EU",rk.get("euClass"))]
    ch="".join(f'<span class="chip" style="background:#eff6ff;color:#1a3e74">{n}: {e(v)}</span>' for n,v in classes if v)
    lvl=rk.get("level"); lvlchip=f'<span class="chip" style="background:#fee2e2;color:#8b0000">Risco {e(lvl)}</span>' if lvl in("Alto","Crítico") else (f'<span class="chip" style="background:#E3FAF1;color:#006400">Risco {e(lvl)}</span>' if lvl else "")
    return f'<div style="margin-bottom:.5rem">{lvlchip}{ch}</div><p style="font-size:13px;color:#4b5563">{e(rk.get("rationale",""))}</p>'

def render_safety_head(ps):
    b=[]
    if ps.get("highRisk"): b.append('<span class="chip" style="background:#fee2e2;color:#8b0000">Alto risco</span>')
    if ps.get("doubleCheckRequired"): b.append('<span class="chip" style="background:#fff3cd;color:#856404">Dupla checagem obrigatória</span>')
    return ('<div style="margin-bottom:.75rem">'+"".join(b)+'</div>') if b else ""

def render_page(d):
    name=d.get("name",""); icon=d.get("icon",""); desc=d.get("description","")
    cat=d.get("category",""); sub=d.get("subcategory",""); risk=d.get("risk",{})
    slug=d.get("id","")
    url=f"{BASE}/materiais/{slug}"
    ck=d.get("clinicalKnowledge",{})
    # indicações
    ind=ck.get("indications",[])
    ind_html=li([f'<strong>{e(i.get("condition",""))}</strong> — {e(i.get("rationale",""))}' for i in ind], fmt=lambda x:x) or "<li>—</li>"
    # contraindicações (canônico)
    contra=ck.get("contraindications",[])
    contra_html="".join(f'<div class="err"><i class="fa-solid fa-ban" aria-hidden="true"></i><div><strong>{e(c.get("condition",""))}</strong><br><span style="font-size:12px">{e(c.get("risk",""))}</span></div></div>' for c in contra) or "<p>—</p>"
    # segurança
    ps=d.get("patientSafety",{})
    never="".join(f'<div class="err"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><div><strong>{e(n)}</strong></div></div>' for n in ps.get("neverEvents",[]))
    alerts=li([f'<strong>{e(a.get("type",""))}:</strong> {e(a.get("message",""))}' for a in ps.get("alerts",[])], fmt=lambda x:x)
    # NANDA/NIC/NOC
    np_=d.get("nursingIntelligence",{}).get("nursingProcess",{})
    def taxo(items,code): return li([f'{e(i.get("label",""))} ({e(i.get(code,""))})' for i in items])
    # evidência
    ev=ck.get("evidence",{})
    ev_types=", ".join(ev.get("types",[])) if isinstance(ev.get("types"),list) else ""
    # recursos
    tdocs=d.get("catalog",{}).get("technicalDocs",[])
    recursos=li([f'<a class="reslink" href="{e(t)}"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> {e(os.path.basename(t))}</a>' for t in tdocs], fmt=lambda x:x) or "<li>—</li>"

    ldjson=json.dumps({"@context":"https://schema.org","@graph":[
        {"@type":"MedicalWebPage","@id":f"{url}#webpage","name":name,"inLanguage":"pt-BR","url":url,
         "description":desc,"reviewedBy":{"@type":"Person","name":"a nomear"},
         "about":{"@type":"MedicalDevice" if cat=="Materiais e Dispositivos" else "MedicalEntity","name":name},
         "isPartOf":{"@type":"WebSite","name":"Calculadoras de Enfermagem","url":BASE}},
        {"@type":"BreadcrumbList","itemListElement":[
            {"@type":"ListItem","position":1,"name":"Início","item":BASE},
            {"@type":"ListItem","position":2,"name":cat,"item":f"{BASE}/materiais"},
            {"@type":"ListItem","position":3,"name":name,"item":url}]}]}, ensure_ascii=False)

    STYLE = """.page-wrap{width:100%;max-width:1280px;margin:0 auto;padding:1.5rem 1rem;display:flex;flex-direction:column;gap:1.25rem}
.chip{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-radius:999px;padding:4px 10px;margin:0 4px 4px 0}
.hero{background:radial-gradient(1200px 400px at 15% -20%,rgba(37,99,235,.35),transparent 60%),linear-gradient(135deg,#0a1c36,#1a3e74 55%,#1d4ed8 120%);color:#fff;border-radius:16px;padding:24px;box-shadow:0 8px 24px rgba(10,28,54,.25)}
.hero h1{font-family:'Nunito Sans',sans-serif;font-weight:900;font-size:1.9rem;line-height:1.15;margin:.25rem 0;display:flex;align-items:center;gap:.6rem}
.hero p{color:rgba(255,255,255,.88);max-width:64ch;margin:.5rem 0 0}
.hero .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}
@media(min-width:640px){.hero .facts{grid-template-columns:repeat(4,1fr)}}
.hero .facts div{background:rgba(255,255,255,.1);border-radius:10px;padding:10px}
.hero .facts dt{font-size:11px;opacity:.75;margin:0}.hero .facts dd{font-weight:700;margin:2px 0 0}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.tabs{display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid #e5e7eb;padding:8px 8px 0}
.tab-btn{border:0;background:0;padding:8px 12px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;cursor:pointer;font-size:.9rem}
.tab-btn.active{color:#1a3e74;border-bottom-color:#1a3e74}.tab-btn:focus-visible{outline:3px solid #ff0;outline-offset:2px}
.tab-content{display:none;padding:20px;font-size:14px;color:#334155;line-height:1.65}.tab-content.active{display:block}
h2.sec{font-family:'Nunito Sans',sans-serif;font-size:1.05rem;font-weight:800;color:#0f2a50;margin:0 0 .5rem}
h3.sub{font-weight:700;color:#1f2937;margin:1rem 0 .25rem;font-size:.9rem}
table.data{width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
table.data td{padding:8px;border-top:1px solid #eef2f7;vertical-align:top}
ul.clean{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.5rem}
.err{display:flex;gap:.6rem;align-items:flex-start;padding:.6rem .8rem;border-radius:10px;background:#fee2e2;border:1px solid #fecaca;margin-bottom:.6rem}.err i{color:#b91c1c;margin-top:.15rem}.err strong{color:#7f1d1d}
.box-blue{padding:1rem;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe}
a.reslink{display:inline-flex;align-items:center;gap:.5rem;color:#1a3e74;font-weight:700;text-decoration:none}a.reslink:hover{text-decoration:underline}
.draft-banner{background:#f59e0b;color:#111827;text-align:center;font-weight:700;padding:.5rem;font-size:.8rem}
@media print{.tabs,.draft-banner{display:none!important}.tab-content{display:block!important}}"""

    return f"""<!DOCTYPE html>
<html lang="pt-BR" dir="auto" data-draft="true" data-content-id="{e(slug)}">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{e(name)} | Guia Clínico de Enfermagem</title>
  <meta name="description" content="{e(desc)}">
  <meta name="robots" id="robotsMeta" content="index,follow">
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="pt-BR" href="{url}"><link rel="alternate" hreflang="x-default" href="{url}">
  <link rel="stylesheet" href="{BASE}/global-styles.css">
  <link rel="stylesheet" href="{BASE}/public/output.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="../css/pages/biblioteca.css">
  <script type="application/ld+json">{ldjson}</script>
</head>
<body>
  <a href="#conteudo" class="sr-only focus-within:not-sr-only" style="position:absolute;z-index:100002;left:8px;top:8px;background:#1a3e74;color:#fff;padding:8px 14px;border-radius:8px">Pular para o conteúdo</a>
  <div id="statusMessage" class="sr-only" role="status" aria-live="polite"></div>
  <div id="draftBanner" class="draft-banner" hidden>RASCUNHO — revisão clínica pendente (revisor a nomear). Não publicar. Use <code>?publish=1</code> só após a revisão.</div>
  <div id="global-header-container"></div>
  <div id="language-selector-placeholder"></div>
  <main id="conteudo"><div class="page-wrap">
    <nav class="breadcrumb" aria-label="Trilha de navegação"><ol>
      <li><a href="{BASE}">Início</a></li><li><a href="{BASE}/materiais">{e(cat)}</a></li><li>{e(name)}</li>
    </ol></nav>
    <section class="cko-hero">
      <div>{chips([cat, sub, ("Alto risco" if risk.get("level")=="Alto" else "")],"background:rgba(255,255,255,.15);color:#fff")}</div>
      <h1><i class="{'fa-solid fa-notes-medical' if not icon else ''}" aria-hidden="true"></i>{e(icon)} {e(name)}</h1>
      <p>{e(desc)}</p>
      <dl class="facts">
        <div><dt>Categoria</dt><dd>{e(cat)}</dd></div>
        <div><dt>Subcategoria</dt><dd>{e(sub)}</dd></div>
        <div><dt>Risco</dt><dd>{e(risk.get("level","—"))}</dd></div>
        <div><dt>Classe ANVISA</dt><dd>{e(risk.get("anvisaClass","—") or "—")}</dd></div>
      </dl>
    </section>
    <div class="action-bar">
      <button id="favBtn" aria-pressed="false" onclick="toggleFav()"><i class="fa-regular fa-star" aria-hidden="true"></i> Favoritar</button>
      <button onclick="sharePage()"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Compartilhar</button>
      <button onclick="window.print()"><i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button>
      <button onclick="window.print()"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> PDF</button>
      <button onclick="reportErr()"><i class="fa-solid fa-flag" aria-hidden="true"></i> Reportar</button>
    </div>
    <div class="cko-card">
      <div class="cko-tabs" role="tablist">
        <button class="tab-btn active" id="tab-btn-visao" role="tab" aria-selected="true" onclick="switchTab('visao')">Visão geral</button>
        <button class="tab-btn" id="tab-btn-caract" role="tab" aria-selected="false" onclick="switchTab('caract')">Características</button>
        <button class="tab-btn" id="tab-btn-usos" role="tab" aria-selected="false" onclick="switchTab('usos')">Usos &amp; indicações</button>
        <button class="tab-btn" id="tab-btn-contra" role="tab" aria-selected="false" onclick="switchTab('contra')">Contraindicações</button>
        <button class="tab-btn" id="tab-btn-seguranca" role="tab" aria-selected="false" onclick="switchTab('seguranca')">Segurança</button>
        <button class="tab-btn" id="tab-btn-processo" role="tab" aria-selected="false" onclick="switchTab('processo')">NANDA/NIC/NOC</button>
        <button class="tab-btn" id="tab-btn-evidencia" role="tab" aria-selected="false" onclick="switchTab('evidencia')">Evidência &amp; recursos</button>
      </div>
      <div class="tab-content active" id="tab-visao" role="tabpanel" aria-labelledby="tab-btn-visao">
        <h2 class="sec">Finalidade clínica</h2><p>{e(ck.get('clinicalPurpose',{}).get('primary',''))}</p>
        <ul class="clean" style="margin-top:.5rem">{li(ck.get('clinicalPurpose',{}).get('secondary',[]))}</ul>
      </div>
      <div class="tab-content" id="tab-caract" role="tabpanel" aria-labelledby="tab-btn-caract">
        <h2 class="sec">Especificações & características</h2>{render_specs(d)}{render_risk(d.get("risk",{}))}{render_characteristics(d)}
      </div>
      <div class="tab-content" id="tab-usos" role="tabpanel" aria-labelledby="tab-btn-usos">
        <h2 class="sec">Indicações</h2><ul class="clean">{ind_html}</ul>
      </div>
      <div class="tab-content" id="tab-contra" role="tabpanel" aria-labelledby="tab-btn-contra">
        <h2 class="sec">Contraindicações</h2>{contra_html}
      </div>
      <div class="tab-content" id="tab-seguranca" role="tabpanel" aria-labelledby="tab-btn-seguranca">
        <h2 class="sec">Segurança do paciente</h2>{render_safety_head(d.get("patientSafety",{}))}
        <h3 class="sub">Nunca-eventos</h3>{never or '<p>—</p>'}
        <h3 class="sub">Alertas</h3><ul class="clean">{alerts}</ul>
      </div>
      <div class="tab-content" id="tab-processo" role="tabpanel" aria-labelledby="tab-btn-processo">
        <h2 class="sec">Processo de enfermagem</h2>
        <h3 class="sub">Diagnósticos (NANDA-I)</h3><ul class="clean">{taxo(np_.get('diagnosis',[]),'nanda')}</ul>
        <h3 class="sub">Intervenções (NIC)</h3><ul class="clean">{taxo(np_.get('interventions',[]),'nic')}</ul>
        <h3 class="sub">Resultados (NOC)</h3><ul class="clean">{taxo(np_.get('outcomes',[]),'noc')}</ul>
      </div>
      <div class="tab-content" id="tab-evidencia" role="tabpanel" aria-labelledby="tab-btn-evidencia">
        <h2 class="sec">Evidência</h2>
        <div class="box-blue"><strong style="color:#0f2a50">Nível: {e(ev.get('level','—'))}</strong>
          <p style="font-size:12px;color:#475569;margin:.25rem 0 0">{e(ev_types)}</p></div>
        <h2 class="sec" style="margin-top:1rem">Recursos</h2><ul class="clean">{recursos}</ul>
        <p style="font-size:12px;color:#64748b;margin-top:.75rem">Revisor clínico a nomear (página em rascunho).</p>
      </div>
    </div>
    <p class="ref">Conteúdo educativo — não substitui protocolo institucional nem julgamento clínico.</p>
  </div></main>
  <div id="footer-placeholder"></div>
  <script src="{BASE}/global-scripts.js" defer></script>
  <script src="{BASE}/lang-selector.js" defer></script>
  <script>
    function cdeToast(t,d,ty){{if(window.CDE&&window.CDE.toast){{window.CDE.toast(t,d,ty);}}var s=document.getElementById('statusMessage');if(s)s.textContent=(t+' '+(d||'')).trim();}}
    function cid(){{return document.documentElement.getAttribute('data-content-id');}}
    function toggleFav(){{var b=document.getElementById('favBtn');var f=JSON.parse(localStorage.getItem('favorites')||'[]');var on=f.indexOf(cid())>-1;if(on){{f=f.filter(function(x){{return x!==cid();}});}}else{{f.push(cid());}}localStorage.setItem('favorites',JSON.stringify(f));var now=!on;b.setAttribute('aria-pressed',now);b.querySelector('i').className=now?'fa-solid fa-star':'fa-regular fa-star';cdeToast(now?'Adicionado aos favoritos':'Removido dos favoritos','','success');}}
    function sharePage(){{var d={{title:document.title,url:location.href}};if(navigator.share){{navigator.share(d).catch(function(){{}});}}else if(navigator.clipboard){{navigator.clipboard.writeText(location.href).then(function(){{cdeToast('Link copiado','','success');}});}}else{{cdeToast('Copie o link',location.href,'info');}}}}
    function reportErr(){{cdeToast('Obrigado','Reporte registrado para revisão.','info');}}
    (function(){{var f=JSON.parse(localStorage.getItem('favorites')||'[]');if(f.indexOf(cid())>-1){{var b=document.getElementById('favBtn');if(b){{b.setAttribute('aria-pressed','true');b.querySelector('i').className='fa-solid fa-star';}}}}}})();
    function switchTab(id){{document.querySelectorAll('.tab-btn').forEach(function(b){{b.classList.remove('active');b.setAttribute('aria-selected','false');}});document.querySelectorAll('.tab-content').forEach(function(c){{c.classList.remove('active');}});var b=document.getElementById('tab-btn-'+id),c=document.getElementById('tab-'+id);if(b){{b.classList.add('active');b.setAttribute('aria-selected','true');}}if(c)c.classList.add('active');var s=document.getElementById('statusMessage');if(s)s.textContent='Aba: '+(b?b.textContent.trim():id);}}
    (function(){{var p=new URLSearchParams(location.search);var dr=document.documentElement.getAttribute('data-draft')==='true'&&p.get('publish')!=='1';var r=document.getElementById('robotsMeta'),ba=document.getElementById('draftBanner');if(r)r.setAttribute('content',dr?'noindex,nofollow':'index,follow');if(ba)ba.hidden=!dr;}})();
  </script>
</body>
</html>"""

def main():
    args=sys.argv[1:]
    if args and args[0]=="--all":
        srcdir, outdir = args[1], args[2]
        os.makedirs(outdir, exist_ok=True)
        for f in sorted(glob.glob(f"{srcdir}/*.json")):
            d=json.load(open(f,encoding="utf-8"))
            open(f"{outdir}/{d['id']}.html","w",encoding="utf-8").write(render_page(d))
            print("gerado:", d["id"]+".html")
    else:
        src, outdir = args[0], (args[1] if len(args)>1 else ".")
        os.makedirs(outdir, exist_ok=True)
        d=json.load(open(src,encoding="utf-8"))
        open(f"{outdir}/{d['id']}.html","w",encoding="utf-8").write(render_page(d))
        print("gerado:", d["id"]+".html")

if __name__=="__main__":
    main()
