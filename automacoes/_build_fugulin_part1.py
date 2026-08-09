# Script para reconstruir fugulin.html com todas as melhorias solicitadas
# Preserva o <head> original e reescreve o corpo

HEAD_LINES = 79  # linhas 1-79 do head (meta tags, critical fonts, hreflang)

with open('fugulin.html', 'r', encoding='utf-8') as f:
    original_lines = f.readlines()

head_section = ''.join(original_lines[:HEAD_LINES])

# ============================================================
# NOVOS ESTILOS CSS (compactos, sombras escuras, cards menores)
# ============================================================
new_styles = '''
<!-- 11. Outros Scripts/Tags -->
<style>
:root{--navy:#1a3e74;--navy-light:#1e4d8c;--navy-dark:#163269;--blue-100:#bfdbfe;--blue-50:#eff6ff;--slate-800:#1e293b;--slate-600:#475569;--slate-500:#64748b;--slate-400:#94a3b8;--slate-200:#e2e8f0;--slate-100:#f1f5f9;--slate-50:#f8fafc;--green:#16a34a;--red:#e11d48;--amber:#d97706}
*{box-sizing:border-box}
#progress-container{position:fixed;top:0;left:0;width:100%;height:4px;background:var(--slate-200);z-index:9999}
#progress-bar-global{height:100%;background:linear-gradient(90deg,#3b82f6,#1a3e74);width:0;transition:width .4s ease}

/* CARDS COM SOMBRA ESCURA NO REBORDO */
.card-dark{border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.08);overflow:hidden}
.card-navy{background:linear-gradient(135deg,var(--navy),var(--navy-light) 60%,var(--navy-dark));border-radius:14px;box-shadow:0 8px 32px rgba(26,62,116,.45);position:relative;overflow:hidden}
.card-navy::before{content:"";position:absolute;top:0;right:0;width:160px;height:160px;background:#fff;opacity:.05;border-radius:50%;filter:blur(20px);transform:translate(30%,-30%)}
.card-navy::after{content:"";position:absolute;bottom:0;left:0;width:120px;height:120px;background:#4a90e2;opacity:.15;border-radius:50%;filter:blur(15px);transform:translate(-20%,30%)}

/* DADOS PACIENTE COMPACTO */
.dados-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#fff;border:none;cursor:pointer;transition:background .15s;border-radius:12px}
.dados-body{display:none;padding:0 14px 12px}
.dados-body.open{display:block;animation:fadeIn .25s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.input-compact{width:100%;padding:8px 10px;border-radius:7px;border:2px solid var(--slate-200);font-size:13px;font-weight:700;color:var(--slate-800);outline:none;transition:border-color .2s,box-shadow .2s;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.input-compact:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(26,62,116,.2)}
.select-compact{width:100%;padding:8px 10px;border-radius:7px;border:2px solid var(--slate-200);font-size:13px;font-weight:700;color:var(--slate-800);outline:none;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.1);appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center}

/* ITENS DE FORMULARIO COMPACTOS */
.item-card{background:#fff;border-radius:10px;border:2px solid var(--slate-200);padding:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:border-color .2s,box-shadow .2s}
.item-card:focus-within,.item-card:hover{border-color:var(--navy-light);box-shadow:0 6px 20px rgba(26,62,116,.2)}
.item-badge{font-size:10px;font-weight:800;padding:2px 8px;border-radius:16px;background:var(--blue-50);color:var(--navy);border:1px solid var(--blue-100);white-space:nowrap}
.item-select{width:100%;padding:10px 12px;border-radius:7px;border:2px solid var(--slate-200);color:var(--slate-800);background:#fff;font-size:12px;font-weight:600;outline:none;box-shadow:0 2px 8px rgba(0,0,0,.1);appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center;transition:border-color .2s,box-shadow .2s}
.item-select:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(26,62,116,.2)}
.mini-bar-wrap{height:4px;background:var(--slate-200);border-radius:2px;overflow:hidden;margin-top:8px;box-shadow:inset 0 1px 2px rgba(0,0,0,.1)}
.mini-bar-fill{height:100%;border-radius:2px;transition:width .4s ease,background-color .4s ease;background:var(--slate-300)}

/* BOTOES */
.btn-primary{background:linear-gradient(135deg,var(--navy),var(--navy-light));color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;box-shadow:0 4px 16px rgba(26,62,116,.35);transition:transform .15s,box-shadow .15s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(26,62,116,.45)}
.btn-secondary{background:#fff;color:var(--slate-600);border:2px solid var(--slate-200);padding:12px 24px;border-radius:10px;font-size:13px;font-weight:800;text-transform:uppercase;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.08);transition:background .15s,border-color .15s}
.btn-secondary:hover{background:var(--slate-50);border-color:var(--slate-300)}
.btn-sm{padding:6px 14px;font-size:11px;border-radius:7px;font-weight:700}
.btn-outline{background:#fff;color:var(--navy);border:2px solid var(--navy);padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(26,62,116,.15);transition:all .15s}
.btn-outline:hover{background:var(--blue-50);box-shadow:0 4px 12px rgba(26,62,116,.25)}

/* RESULTADO COMPACTO */
.score-big{font-size:56px;font-weight:900;line-height:1;color:#fff;font-variant-numeric:tabular-nums;text-shadow:0 4px 10px rgba(0,0,0,.2)}
.status-pill{display:inline-block;padding:4px 18px;border-radius:20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.15)}

/* TABELA DE DOMINIOS COMPACTA */
.dom-table{width:100%;border-collapse:collapse;font-size:12px}
.dom-table th{background:var(--slate-50);color:var(--navy);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:8px 10px;text-align:left;border-bottom:2px solid var(--slate-200)}
.dom-table td{padding:8px 10px;border-bottom:1px solid var(--slate-100);font-size:12px;font-weight:500;color:var(--slate-800)}
.dom-table tfoot td{background:var(--blue-50);font-weight:900;color:var(--navy);font-size:13px;border-top:2px solid var(--navy)}

/* NANDA COMPACTO */
.nanda-item{background:#fff;border:2px solid var(--slate-100);border-radius:8px;padding:8px 10px;margin-bottom:6px;box-shadow:0 1px 4px rgba(0,0,0,.03);transition:border-color .2s}
.nanda-item:hover{border-color:var(--blue-200)}

/* TABELA DE PACIENTES (LOCALSTORAGE) */
.pacientes-table{width:100%;border-collapse:collapse;font-size:11px}
.pacientes-table th{background:var(--navy);color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;padding:8px 6px;text-align:center;position:sticky;top:0}
.pacientes-table td{padding:6px;border-bottom:1px solid var(--slate-100);text-align:center;font-size:11px;font-weight:600}
.pacientes-table tr:hover td{background:var(--blue-50)}

/* REFERENCIAS ABNT */
.ref-abnt{font-size:10px;color:var(--slate-500);line-height:1.4;text-align:left;margin-top:12px}
.ref-abnt p{margin:1px 0}

/* GRID E LAYOUT */
.grid-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.grid-4col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(min-width:640px){.grid-4col{grid-template-columns:repeat(4,1fr)}}
@media(max-width:768px){.grid-2col,.grid-3col{grid-template-columns:1fr}.score-big{font-size:44px}.btn-primary,.btn-secondary{width:100%;text-align:center}}

/* SECAO RESULTADO */
#resultado-section{opacity:0;transition:opacity .4s ease;display:none}
#resultado-section.visible{opacity:1;display:block}

/* SCP HIGHLIGHT */
.scp-highlight{outline:3px solid var(--navy)!important;outline-offset:2px;box-shadow:0 6px 20px rgba(0,0,0,.3)!important}

/* COMPACTOS GERAIS */
h3{font-size:13px;line-height:1.2}
p{margin:2px 0;line-height:1.3}
.lgpd-notice{font-size:9px;color:var(--slate-400);text-align:center;margin:6px 0 0;line-height:1.1}

@media print{.no-print{display:none!important}}
</style>
<link rel="preload" href="/img/icontopbar1-calculadoras-de-enfermagem.webp" as="image" type="image/webp" fetchpriority="high">
<style id="anti-cls-placeholders">#global-header-container{display:block;width:100%;min-height:96px;background-color:transparent}@media(max-width:768px){#global-header-container{min-height:60px}}#language-selector-placeholder{display:block;width:100%;min-height:46px;background-color:transparent}#footer-placeholder{display:block;min-height:520px;background-color:transparent}@media(min-width:768px){#footer-placeholder{min-height:277px}}</style>
<script src="/global-scripts.js" defer></script>
<script src="/lang-selector.js" defer></script>
<script id="anti-cls-acessibilidade">(function(){try{var f=localStorage.getItem("fontSize");if(f&&f!=="1"){var s=["1em","1.15em","1.3em","1.5em","2em"];var i=Math.min(Math.max(parseInt(f,10),1),s.length);document.documentElement.style.fontSize=s[i-1];}if(localStorage.getItem("darkMode")==="true"){document.documentElement.classList.add("dark-mode");}}catch(e){}})();</script>
</head>

<body class="bg-gray-50 text-gray-800 font-sans">
<div id="progress-container"><div id="progress-bar-global"></div></div>
<div id="global-header-container"></div>
<div id="language-selector-placeholder"></div>

<main id="main-content" class="flex-grow p-3 sm:p-6">
'''

print('Novos estilos e corpo preparados')
print(f'Head section: {len(head_section)} chars')
print(f'New styles: {len(new_styles)} chars')
