// build-nanda.js — Reconstrói nanda.html com conteúdo educacional NANDA-NIC-NOC
const fs = require('fs');
const path = require('path');

// Head padrão
const head = `<!DOCTYPE html><html lang="pt-BR"><head>

<!-- 1. Charset e Viewport -->
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>

<!-- 2. DNS e Preconnects -->
<link href="//googleads.g.doubleclick.net" rel="dns-prefetch"/>
<link href="//pagead2.googlesyndication.com" rel="dns-prefetch"/>

<!-- 3. Title e Metatags (SEO e Redes Sociais) -->
<title>NANDA, NIC e NOC: Guia Completo de SAE para Enfermagem | Calculadoras de Enfermagem</title>
<meta content="Guia definitivo sobre NANDA, NIC e NOC. Entenda as taxonomias de enfermagem, explore diagnósticos e intervenções, e domine a SAE com conteúdo didático e ferramentas interativas." name="description"/>
<meta content="Calculadoras de Enfermagem" name="author"/>
<meta content="index, follow" name="robots"/>
<meta content="pt_BR" property="og:locale"/>
<meta content="website" property="og:type"/>
<meta content="NANDA, NIC e NOC: Guia Completo de SAE para Enfermagem | Calculadoras de Enfermagem" property="og:title"/>
<meta content="Guia definitivo sobre NANDA, NIC e NOC. Entenda as taxonomias de enfermagem, explore diagnósticos e intervenções, e domine a SAE." property="og:description"/>
<meta content="https://www.calculadorasdeenfermagem.com.br/nanda.html" property="og:url"/>
<meta content="Calculadoras de Enfermagem" property="og:site_name"/>
<meta content="https://www.calculadorasdeenfermagem.com.br/livronanda-calculadoras-de-enfermagem.webp" property="og:image"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="NANDA, NIC e NOC: Guia Completo de SAE para Enfermagem | Calculadoras de Enfermagem" name="twitter:title"/>
<meta content="Guia definitivo sobre NANDA, NIC e NOC. Entenda as taxonomias de enfermagem, explore diagnósticos e intervenções, e domine a SAE." name="twitter:description"/>
<meta content="https://www.calculadorasdeenfermagem.com.br/livronanda-calculadoras-de-enfermagem.webp" name="twitter:image"/>

<!-- 6. CSS -->
<style id="critical-fonts">@font-face{font-family:'Inter';src:url('/fonts/inter/inter-regular.woff2') format('woff2');font-weight:400;font-display:swap;size-adjust:98%}@font-face{font-family:'Inter';src:url('/fonts/inter/inter-600.woff2') format('woff2');font-weight:500;font-display:swap;size-adjust:98%}@font-face{font-family:'Inter';src:url('/fonts/inter/inter-700.woff2') format('woff2');font-weight:700;font-display:swap;size-adjust:98%}@font-face{font-family:'Inter';src:url('/fonts/inter/inter-900.woff2') format('woff2');font-weight:900;font-display:swap;size-adjust:98%}</style>
<link as="style" href="/public/output.css" onload="this.onload=null;this.rel='stylesheet'" rel="preload"/>
<link as="style" href="/global-styles.css" onload="this.onload=null;this.rel='stylesheet'" rel="preload"/>
<noscript><link href="/public/output.css" rel="stylesheet"/></noscript>
<noscript><link href="/global-styles.css" rel="stylesheet"/></noscript>
<link as="font" crossorigin="" href="/fonts/inter/inter-regular.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="/fonts/inter/inter-600.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="/fonts/inter/inter-700.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="/fonts/inter/inter-900.woff2" rel="preload" type="font/woff2"/>

<link href="https://www.calculadorasdeenfermagem.com.br/nanda.html" rel="canonical"/>
`;

const extraCSS = `
<style>
:root {
--navy: #1a3e74;
--navy-light: #1e4d8c;
--navy-dark: #163269;
}
body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; }
img { max-width: 100%; height: auto; }
iframe { max-width: 100%; }

/* Hero Card */
.meem-card-navy {
background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 60%, var(--navy-dark) 100%);
border-radius: 16px; overflow: hidden; position: relative; isolation: isolate;
}
.meem-card-navy::before {
content: ""; position: absolute; top: 0; right: 0; width: 180px; height: 180px;
background: white; opacity: 0.05; border-radius: 50%; filter: blur(40px);
transform: translate(30%, -30%);
}
.meem-card-navy::after {
content: ""; position: absolute; bottom: 0; left: 0; width: 140px; height: 140px;
background: #4a90e2; opacity: 0.2; border-radius: 50%; filter: blur(30px);
transform: translate(-20%, -20%);
}
.shadow-forte { box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.15) !important; border: 1px solid rgba(226, 232, 240, 0.8); }
.meem-card-navy.shadow-forte { box-shadow: 0 15px 40px rgba(26, 62, 116, 0.4) !important; border: none; }

/* Title bar */
.title-bar { width: 100%; height: 4px; background: linear-gradient(90deg, var(--navy), var(--navy-light), #4a90e2); border-radius: 2px; margin: 0 auto 24px; }

/* Cards */
.card-branco { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
.card-nanda { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 12px; transition: box-shadow 0.2s; }
.card-nanda:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.1); }

/* Accordion */
.domain-header {
padding: 12px 18px; background: #f8fafc; cursor: pointer;
display: flex; justify-content: space-between; align-items: center;
font-weight: 700; color: var(--navy); transition: background 0.2s;
border-bottom: 1px solid #e2e8f0; font-size: 14px;
}
.domain-header:hover { background: #eff6ff; }
.domain-content { display: none; }
.domain-content.open { display: block; }
.diag-item {
padding: 10px 20px; border-bottom: 1px solid #f1f5f9;
cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;
}
.diag-item:hover { background: #f8fafc; padding-left: 24px; }
.diag-item.active { background: #eff6ff; border-left: 4px solid var(--navy); }

/* Tags */
.tag { display: inline-block; padding: 4px 10px; background: #eff6ff; color: var(--navy); border-radius: 20px; font-size: 11px; font-weight: 700; margin: 2px; border: 1px solid #bfdbfe; }
.tag-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.tag-green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

/* Detail panel */
.detail-panel { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; min-height: 200px; }

/* Image zoom */
.img-zoom { cursor: pointer; transition: transform 0.2s; }
.img-zoom:hover { transform: scale(1.02); }
.modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center; }
.modal-overlay.active { display: flex; }
.modal-overlay img { max-width: 95vw; max-height: 95vh; border-radius: 8px; }

/* Steps */
.step-card { display: flex; gap: 16px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 12px; align-items: flex-start; }
.step-num { width: 36px; height: 36px; background: var(--navy); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; flex-shrink: 0; }

/* Responsive */
@media (max-width: 768px) {
.card-branco { padding: 16px; }
.detail-panel { padding: 16px; }
}

/* Nic items */
.nic-item { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: all 0.2s; }
.nic-item:hover { background: #f8fafc; }
.nic-item.active { background: #eff6ff; border-left: 4px solid #4a90e2; }
.nic-activities { display: none; padding: 8px 16px 12px 24px; background: #fafafa; }
.nic-activities.open { display: block; }
</style>
`;

const headClose = `
<link rel="preload" href="/img/icontopbar1-calculadoras-de-enfermagem.webp" as="image" type="image/webp" fetchpriority="high">
<style id="anti-cls-placeholders">#global-header-container{display:block;width:100%;min-height:96px;background-color:transparent}@media(max-width:768px){#global-header-container{min-height:60px}}#language-selector-placeholder{display:block;width:100%;min-height:46px;background-color:transparent}#footer-placeholder{display:block;min-height:520px;background-color:transparent}@media(min-width:768px){#footer-placeholder{min-height:277px}}</style>
<script src="/global-scripts.js" defer></script>
<script src="/lang-selector.js" defer></script>
<script id="anti-cls-acessibilidade">
(function(){try{var f=localStorage.getItem("fontSize");if(f&&f!=="1"){var s=["1em","1.15em","1.3em","1.5em","2em"];var i=Math.min(Math.max(parseInt(f,10),1),s.length);document.documentElement.style.fontSize=s[i-1];}if(localStorage.getItem("darkMode")==="true"){document.documentElement.classList.add("dark-mode");}}catch(e){}})();
</script>
</head>
`;

// Body opening
const bodyOpen = `
<body class="bg-gray-50 text-gray-800 font-inter">
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600">Pular para o conteúdo principal</a>
<div id="statusMessage" class="sr-only" aria-live="polite" aria-atomic="true"></div>
<div id="global-header-container"></div>
<div id="language-selector-placeholder"></div>
<main id="main-content" class="flex-grow p-4 sm:p-8">

<nav aria-label="breadcrumb">
<ol class="breadcrumb">
<li><a href="index.html">Início</a></li>
<li><a href="#">Institucional</a></li>
<li aria-current="page">NANDA, NIC e NOC</li>
</ol>
</nav>

<!-- Hero Card -->
<section class="mb-6 meem-card-navy shadow-forte">
<div class="relative z-10 px-4 sm:px-8 py-8 md:py-10">
<div class="text-center md:text-left">
<p class="text-blue-300 text-xs font-bold uppercase tracking-[0.15em] mb-2">Sistematização da Assistência de Enfermagem</p>
<h1 class="text-white text-3xl md:text-5xl font-black leading-tight mb-3">NANDA, NIC e NOC</h1>
<p class="text-blue-100 text-base font-medium max-w-2xl">Guia completo sobre as taxonomias de enfermagem: diagnósticos (NANDA), intervenções (NIC) e resultados (NOC). Aprenda a usar estas ferramentas essenciais para a SAE.</p>
</div>
</div>
</section>

<!-- === CONTEÚDO PRINCIPAL === -->
<div class="text-left font-inter text-black-custom text-base space-y-4" style="font-weight:400">

<!-- SEÇÃO HISTÓRIA -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl" style="color: var(--navy); font-weight:500">História da Criação da NANDA</h2>
<div class="card-branco text-sm" style="padding:20px">
<div class="flex flex-col md:flex-row gap-5">
<div class="md:w-2/3">
<p>A história da NANDA tem suas raízes no trabalho de enfermeiras pioneiras que reconheceram a necessidade de uma linguagem profissional compartilhada para descrever os julgamentos clínicos feitos por enfermeiras. As origens desse esforço remontam à <strong>Primeira Conferência Nacional sobre a Classificação de Diagnósticos de Enfermagem</strong>, realizada em St. Louis, Missouri, EUA, em 1973.</p>
<p class="mt-2">Os resultados da conferência incluíram o estabelecimento do Centro de Informações sobre Diagnósticos de Enfermagem da Universidade de St. Louis, a adoção da sigla "NANDA" e a formação de capítulos regionais que ajudaram a organizar os primeiros trabalhos colaborativos nos Estados Unidos. Este trabalho representou o primeiro esforço sustentado para desenvolver, definir e classificar sistematicamente os diagnósticos de enfermagem como um corpo distinto de conhecimento profissional.</p>
<p class="mt-2">Figuras-chave incluíram as Dras. <strong>Kristine Gebbie</strong> e <strong>Mary Ann Lavin</strong>, que ajudaram a estabelecer as bases para a classificação padronizada dos diagnósticos de enfermagem, agora amplamente reconhecida como parte da linguagem padronizada de enfermagem (LPE), apoiando a prática, a pesquisa e a educação internacionalmente.</p>
<p class="mt-2">A Dra. <strong>Marjory Gordon</strong> foi eleita a primeira presidente da recém-criada organização NANDA em 1978 e desempenhou um papel de liderança fundamental no avanço do desenvolvimento de diagnósticos de enfermagem. Em <strong>1982</strong>, a associação foi formalmente estabelecida como <em>North American Nursing Diagnosis Association</em>, evoluindo posteriormente para a <strong>NANDA International</strong> (NANDA-I), que gerencia, pesquisa e atualiza a taxonomia dos diagnósticos de enfermagem globalmente.</p>
<p class="mt-2">No Brasil, a padronização dos diagnósticos de enfermagem é respaldada pelo <strong>Conselho Federal de Enfermagem (Cofen)</strong>, que reconhece a NANDA-I como referência para a Sistematização da Assistência de Enfermagem (SAE) através da Resolução COFEN nº 358/2009.</p>
</div>
<div class="md:w-1/3 flex-shrink-0">
<img src="/img/foto-das-enfermeiras-pioneiras-na-criação-da-nanda-internacional.webp" alt="Foto das enfermeiras pioneiras na criação da NANDA International" class="w-full max-w-[280px] mx-auto rounded-lg shadow-md" loading="lazy">
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
<div class="bg-gray-50 rounded-xl p-3 text-center">
<p class="text-xs font-bold uppercase text-gray-500 mb-1">Origem</p>
<p class="text-2xl font-black" style="color: var(--navy)">1973</p>
<p class="text-xs text-gray-600 mt-1">1ª Conferência Nacional em St. Louis, EUA — primeiros diagnósticos criados e classificados</p>
</div>
<div class="bg-gray-50 rounded-xl p-3 text-center">
<p class="text-xs font-bold uppercase text-gray-500 mb-1">Fundação</p>
<p class="text-2xl font-black" style="color: var(--navy)">1982</p>
<p class="text-xs text-gray-600 mt-1">Estabelecida formalmente como North American Nursing Diagnosis Association</p>
</div>
<div class="bg-gray-50 rounded-xl p-3 text-center">
<p class="text-xs font-bold uppercase text-gray-500 mb-1">1ª Presidente</p>
<p class="text-lg font-black" style="color: var(--navy)">Marjory Gordon</p>
<p class="text-xs text-gray-600 mt-1">Eleita em 1978, liderou o avanço dos diagnósticos de enfermagem</p>
</div>
</div>
</div>

<!-- SEÇÃO 1: O que são -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl" style="color: var(--navy); font-weight:500">O que são NANDA, NIC e NOC?</h2>
<p>A Sistematização da Assistência de Enfermagem (SAE) é a ferramenta metodológica que organiza o cuidado do enfermeiro. <strong>NANDA, NIC e NOC</strong> são linguagens padronizadas essenciais para aplicar a SAE de forma eficaz, garantindo um cuidado baseado em evidências e uma comunicação clara entre os profissionais.</p>
<p>Em nossas calculadoras, você verá o botão <strong>NANDA, NIC e NOC</strong> ao lado do botão calcular e gerar PDF. Esse botão gera uma busca personalizada no Google somando a pontuação da escala gerando diagnósticos de enfermagem da NANDA, intervenções do NIC e resultados da NOC. Estas três classificações são pilares fundamentais no processo de enfermagem, permitindo que os enfermeiros pensem criticamente e documentem seu raciocínio clínico de forma padronizada.</p>

<!-- NANDA -->
<div class="card-branco" style="padding:20px">
<h3 class="font-inter font-bold text-dark-blue text-lg" style="color: var(--navy); font-weight:700">NANDA International (NANDA-I)</h3>
<div class="flex flex-col md:flex-row gap-4 mt-3">
<div class="md:w-1/4 flex-shrink-0">
<img height="405" width="330" src="/img/livronanda_diagnosticos-de-enfermagem.webp" alt="Livro NANDA International" class="w-full max-w-[180px] mx-auto rounded-lg shadow-md" loading="lazy">
</div>
<div class="md:w-3/4 text-sm">
<p><strong>NANDA</strong> significa <strong>North American Nursing Diagnosis Association</strong> (Associação Norte-Americana de Diagnósticos de Enfermagem). É a classificação padronizada dos <strong>Diagnósticos de Enfermagem</strong> — um julgamento clínico sobre as respostas de um indivíduo, família ou comunidade a problemas de saúde reais ou potenciais. A NANDA-I fornece uma taxonomia organizada em <strong>13 domínios</strong> e <strong>47 classes</strong>.</p>
<p class="mt-1"><strong>Exemplo:</strong> Paciente com pneumonia e dificuldade respiratória &rarr; "Padrão Respiratório Ineficaz". Paciente acamado com vermelhidão sacral &rarr; "Risco de Integridade da Pele Prejudicada".</p>
</div>
</div>
</div>

<!-- NIC -->
<div class="card-branco" style="padding:20px">
<h3 class="font-inter font-bold text-dark-blue text-lg" style="color: var(--navy); font-weight:700">NIC (Nursing Interventions Classification)</h3>
<div class="flex flex-col md:flex-row gap-4 mt-3">
<div class="md:w-1/4 flex-shrink-0">
<img height="376" width="264" src="img/capa-do-livro-nic-enfermagem.webp" alt="Livro NIC Classificação das Intervenções de Enfermagem" class="w-full max-w-[150px] mx-auto rounded-lg shadow-md" loading="lazy">
</div>
<div class="md:w-3/4 text-sm">
<p><strong>NIC</strong> significa <strong>Classificação das Intervenções de Enfermagem</strong> (Nursing Interventions Classification). É uma classificação abrangente de intervenções — todas as ações que o enfermeiro realiza para atingir os resultados esperados. Cada intervenção tem uma definição e uma lista de atividades. A NIC tem <strong>7 domínios</strong>, <strong>30 classes</strong> e mais de 550 intervenções.</p>
<p class="mt-1"><strong>Exemplo:</strong> Para "Padrão Respiratório Ineficaz" &rarr; Intervenção NIC: "Manejo das Vias Aéreas" (monitorar FR, posicionar paciente, oxigenoterapia).</p>
</div>
</div>
</div>

<!-- NOC -->
<div class="card-branco" style="padding:20px">
<h3 class="font-inter font-bold text-dark-blue text-lg" style="color: var(--navy); font-weight:700">NOC (Nursing Outcomes Classification)</h3>
<div class="flex flex-col md:flex-row gap-4 mt-3">
<div class="md:w-1/4 flex-shrink-0">
<img height="376" width="263" src="img/capa-do-livro-noc-enfermagem.webp" alt="Livro NOC Classificação dos Resultados de Enfermagem" class="w-full max-w-[150px] mx-auto rounded-lg shadow-md" loading="lazy">
</div>
<div class="md:w-3/4 text-sm">
<p><strong>NOC</strong> significa <strong>Classificação dos Resultados de Enfermagem</strong> (Nursing Outcomes Classification). É uma classificação de resultados do paciente — estados, comportamentos ou percepções mensuráveis influenciados pelas intervenções de enfermagem. Cada resultado possui indicadores e escalas de mensuração (1=grave a 5=nenhum). A NOC está organizada em <strong>7 domínios</strong> e <strong>32 classes</strong>.</p>
<p class="mt-1"><strong>Exemplo:</strong> Para "Padrão Respiratório Ineficaz" + "Manejo das Vias Aéreas" &rarr; Resultado NOC: "Estado Respiratório: Ventilação" (indicadores: FR, profundidade, SpO₂).</p>
</div>
</div>
</div>

<!-- SEÇÃO 2: Imagem da Taxonomia -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6" style="color: var(--navy); font-weight:500">Estrutura da Taxonomia NANDA Internacional</h2>
<div class="card-branco text-center" style="padding:16px">
<p class="text-xs text-gray-500 mb-2">Clique na imagem para ampliar</p>
<img src="/img/taxonomia_da_nanda_internacional_estrutura.webp" alt="Estrutura da Taxonomia NANDA Internacional" class="img-zoom w-full max-w-lg mx-auto rounded-lg shadow-md" onclick="document.getElementById('modal-taxonomia').classList.add('active')" loading="lazy">
</div>
<div id="modal-taxonomia" class="modal-overlay" onclick="this.classList.remove('active')">
<img src="/img/taxonomia_da_nanda_internacional_estrutura.webp" alt="Taxonomia NANDA ampliada" onclick="event.stopPropagation()">
</div>

<!-- SEÇÃO 3: Explorador Interativo NANDA -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6" style="color: var(--navy); font-weight:500">Explore a Taxonomia NANDA</h2>
<p class="text-sm">Navegue pelos 13 domínios da taxonomia NANDA-I. Clique em um domínio para expandir e em um diagnóstico para ver definição, características definidoras e fatores relacionados.</p>

<div class="flex flex-col lg:flex-row gap-4 mt-3">
<div class="lg:w-1/2">
<div class="flex items-center gap-3 mb-3 flex-wrap">
<span class="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full" id="badge-dominios">Carregando...</span>
<span class="text-gray-300 text-xs">|</span>
<span class="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full" id="badge-diagnosticos">Carregando...</span>
</div>
<div id="nanda-accordion" class="space-y-0">
<div class="text-center p-8 bg-white rounded-xl"><p class="font-bold text-gray-500">Carregando banco NANDA...</p></div>
</div>
</div>
<div class="lg:w-1/2">
<div id="nanda-detail" class="detail-panel" style="padding:18px">
<div class="text-center opacity-50 py-10">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="text-3xl text-gray-300 mb-2 mx-auto" fill="currentColor" width="1em" height="1em"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM112 256l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
<p class="font-bold text-gray-500 text-sm">Selecione um diagnóstico</p>
<p class="text-xs text-gray-400">Definições, características definidoras e fatores relacionados aparecerão aqui.</p>
</div>
</div>
</div>
</div>

<!-- SEÇÃO 4: Passo a passo -->
<div class="mt-6">
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mb-3" style="color: var(--navy); font-weight:500">Passo a Passo: Como Usar a NANDA na Prática Clínica</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">1</div><div class="text-sm"><strong>Coleta de Dados:</strong> Realize anamnese e exame físico. Colete sinais vitais, queixas, histórico e dados objetivos.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">2</div><div class="text-sm"><strong>Identifique Padrões:</strong> Agrupe dados por sistemas/domínios. Identifique alterações e riscos potenciais.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">3</div><div class="text-sm"><strong>Busque no Explorador:</strong> Use o explorador NANDA acima para encontrar diagnósticos correspondentes aos padrões identificados.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">4</div><div class="text-sm"><strong>Selecione o Diagnóstico:</strong> Clique no diagnóstico para ver definição completa, características e fatores relacionados.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">5</div><div class="text-sm"><strong>Confirme com Evidências:</strong> Compare características definidoras com os dados do paciente. Fundamente em 2-3 características presentes.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">6</div><div class="text-sm"><strong>Planeje Intervenções (NIC):</strong> Para cada diagnóstico, planeje intervenções usando a NIC. Defina resultados (NOC) com indicadores mensuráveis.</div></div>
<div class="step-card" style="padding:12px"><div class="step-num" style="width:30px;height:30px;font-size:14px">7</div><div class="text-sm"><strong>Implemente e Avalie:</strong> Execute as intervenções, monitore resultados. Reavalie periodicamente e ajuste o plano.</div></div>
</div>
</div>

<!-- SEÇÃO 5: Explorador NIC -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6" style="color: var(--navy); font-weight:500">Explore as Intervenções NIC</h2>
<p class="text-sm">Navegue pelas intervenções de enfermagem da classificação NIC. Cada intervenção possui código, definição e lista de atividades recomendadas.</p>

<div class="flex flex-col lg:flex-row gap-4 mt-3">
<div class="lg:w-1/2">
<div class="flex items-center gap-3 mb-3 flex-wrap">
<span class="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full" id="badge-nic-total">Carregando...</span>
</div>
<div class="relative mb-3">
<input type="text" id="nic-search" placeholder="Pesquisar intervenção NIC..." class="w-full h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autocomplete="off">
</div>
<div id="nic-list" class="space-y-0 max-h-[400px] overflow-y-auto bg-white rounded-xl border border-gray-200">
<div class="text-center p-8"><p class="font-bold text-gray-500">Carregando banco NIC...</p></div>
</div>
</div>
<div class="lg:w-1/2">
<div id="nic-detail" class="detail-panel" style="padding:18px">
<div class="text-center opacity-50 py-10">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="text-3xl text-gray-300 mb-2 mx-auto" fill="currentColor" width="1em" height="1em"><path d="M543.8 287.6c17 0 32-14 32-32.1c1-9-3-17-11-24L512 185l0-121c0-17.7-14.3-32-32-32l-32 0c-17.7 0-32 14.3-32 32l0 36.7L309.5 7c-6-5-14-7-21-7s-15 1-22 8L10 231.5c-7 7-10 15-10 24c0 18 14 32.1 32 32.1l32 0 0 69.7c-.1 .9-.1 1.9-.1 2.8l0 112c0 22.1 17.9 40 40 40l16 0c1.2 0 2.4-.1 3.6-.2c1.5 .1 3 .2 4.5 .2l31.9 0 24 0c22.1 0 40-17.9 40-40l0-24 0-64c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 64 0 24c0 22.1 17.9 40 40 40l24 0 32.5 0c1.4 0 2.8 0 4.2-.1c1.1 .1 2.2 .1 3.3 .1l16 0c22.1 0 40-17.9 40-40l0-16.2c.3-2.6 .5-5.3 .5-8.1l-.7-160.2 32 0z"/></svg>
<p class="font-bold text-gray-500 text-sm">Selecione uma intervenção</p>
<p class="text-xs text-gray-400">O código, definição e atividades aparecerão aqui.</p>
</div>
</div>
</div>
</div>

<!-- SEÇÃO 6: Periodicidade -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6" style="color: var(--navy); font-weight:500">Periodicidade de Atualização das Taxonomias</h2>
<div class="card-branco text-sm" style="padding:20px">
<p>As taxonomias NANDA-I, NIC e NOC são revisadas e atualizadas periodicamente por comitês internacionais de especialistas:</p>
<ul class="list-disc list-inside space-y-2 ml-4 mt-2">
<li><strong>NANDA-I:</strong> A cada <strong>3 anos</strong> (aproximadamente). A cada ciclo, novos diagnósticos são adicionados, existentes são revisados com base em evidências e alguns podem ser aposentados. Edição atual: <strong>NANDA-I 2024-2026</strong> (13ª ed.), com 267 diagnósticos.</li>
<li><strong>NIC:</strong> A cada <strong>4-5 anos</strong>. A 7ª edição (2018) é a referência mais recente publicada em português, com 565 intervenções em 7 domínios e 30 classes.</li>
<li><strong>NOC:</strong> A cada <strong>4-5 anos</strong>, em sincronia com a NIC. A 6ª edição (2018) contém 540 resultados com indicadores e escalas de mensuração.</li>
</ul>
<p class="mt-3"><strong>Taxonomia vigente em 2026:</strong> NANDA-I 2024-2026 (13ª edição), 267 diagnósticos em 13 domínios e 47 classes.</p>
</div>

<!-- SEÇÃO 7: Importância para SAE -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6" style="color: var(--navy); font-weight:500">A Importância da NANDA, NIC e NOC na SAE</h2>
<div class="card-branco text-sm" style="padding:20px">
<p>A Sistematização da Assistência de Enfermagem (SAE) é um método científico que organiza o cuidado em etapas. NANDA, NIC e NOC se encaixam nessas etapas:</p>
<div class="overflow-x-auto mt-3">
<table class="w-full text-sm border-collapse">
<thead><tr class="bg-gray-50"><th class="p-2 text-left border-b-2 font-bold" style="color: var(--navy); border-color: var(--navy)">Etapa da SAE</th><th class="p-2 text-left border-b-2 font-bold" style="color: var(--navy); border-color: var(--navy)">Taxonomia</th><th class="p-2 text-left border-b-2 font-bold" style="color: var(--navy); border-color: var(--navy)">Ação do Enfermeiro</th></tr></thead>
<tbody>
<tr class="border-b"><td class="p-2 font-bold">1. Coleta de Dados</td><td class="p-2">&mdash;</td><td class="p-2">Anamnese e exame físico completos</td></tr>
<tr class="border-b"><td class="p-2 font-bold">2. Diagnóstico</td><td class="p-2"><span class="tag">NANDA</span></td><td class="p-2">Formula um diagnóstico de enfermagem</td></tr>
<tr class="border-b"><td class="p-2 font-bold">3. Planejamento</td><td class="p-2"><span class="tag">NOC</span> <span class="tag-amber">NIC</span></td><td class="p-2">Define resultados esperados (NOC) e intervenções (NIC)</td></tr>
<tr class="border-b"><td class="p-2 font-bold">4. Implementação</td><td class="p-2"><span class="tag-amber">NIC</span></td><td class="p-2">Executa as intervenções planejadas</td></tr>
<tr><td class="p-2 font-bold">5. Avaliação</td><td class="p-2"><span class="tag">NOC</span></td><td class="p-2">Avalia resultados através dos indicadores NOC</td></tr>
</tbody>
</table>
</div>
<p class="mt-3">Benefícios de utilizar NANDA, NIC e NOC na SAE:</p>
<ul class="list-disc list-inside space-y-1 ml-4 mt-1">
<li><strong>Padronização:</strong> Linguagem universal compreendida por enfermeiros globalmente</li>
<li><strong>Visibilidade:</strong> Torna o cuidado de enfermagem mais visível e mensurável</li>
<li><strong>Qualidade:</strong> Melhora a qualidade e segurança do paciente com planejamento sistemático</li>
<li><strong>Pesquisa:</strong> Facilita a pesquisa em enfermagem permitindo análise de eficácia</li>
<li><strong>Autonomia:</strong> Reforça a autonomia profissional do enfermeiro</li>
<li><strong>Documentação:</strong> Permite registro padronizado e rastreável do processo de enfermagem</li>
</ul>
</div>

<!-- SEÇÃO 8: Referências -->
<h2 class="font-inter font-medium text-dark-blue text-xl lg:text-2xl mt-6 mb-16" style="color: var(--navy); font-weight:500">Referências Bibliográficas</h2>
<div class="card-branco text-left text-sm space-y-3" style="line-height: 1.6; padding:20px">
<p>HERDMAN, T. H.; KAMITSURU, S. (Org.). <strong>Diagnósticos de enfermagem da NANDA-I: definições e classificação 2024-2026</strong>. 13. ed. Porto Alegre: Artmed, 2024.</p>
<p>BULECHEK, G. M.; BUTCHER, H. K.; DOCHTERMAN, J. M.; WAGNER, C. M. (Eds.). <strong>Classificação das Intervenções de Enfermagem (NIC)</strong>. 7. ed. Rio de Janeiro: Elsevier, 2018.</p>
<p>MOORHEAD, S.; JOHNSON, M.; MAAS, M. L.; SWANSON, E. (Eds.). <strong>Classificação dos Resultados de Enfermagem (NOC)</strong>. 6. ed. Rio de Janeiro: Elsevier, 2018.</p>
<p>BOTURA, A. L. <strong>Classificações de diagnóstico e intervenção de enfermagem</strong>. Artigo científico. Disponível em: <a href="docs/Classificações-de-diagnóstico-e-intervenção-de-enfermagem_dra_alba_lucia_botura.pdf" class="text-blue-600 hover:underline font-bold" target="_blank" rel="noopener">docs/Classificações-de-diagnóstico-e-intervenção-de-enfermagem_dra_alba_lucia_botura.pdf</a>. Acesso em: 31 jul. 2026.</p>
</div>

</div><!-- fecha text-left -->
</main>
`;

// Footer
const footer = `
<div id="footer-placeholder"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
setTimeout(() => {
fetch("/footer.html")
.then(response => response.text())
.then((data) => {
document.getElementById("footer-placeholder").innerHTML = data;
carregarTraducoes('pt', 'footer.json');
carregarTraducoes('pt', 'cookies.json');
});
}, 150);
});
</script>
`;

// ===== JAVASCRIPT =====
// Lê os bancos de dados
let bancoNanda, bancoNic;
try {
  bancoNanda = JSON.parse(fs.readFileSync(path.join(__dirname, 'banco_nanda.json'), 'utf8'));
} catch(e) { bancoNanda = []; console.log('Aviso: banco_nanda.json não encontrado'); }
try {
  bancoNic = JSON.parse(fs.readFileSync(path.join(__dirname, 'banco_nic_completo.json'), 'utf8'));
} catch(e) { bancoNic = []; console.log('Aviso: banco_nic_completo.json não encontrado'); }

// Função para escapar strings para JS
function jsStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/</g, '\\x3c').replace(/>/g, '\\x3e');
}

// Normaliza nome de domínio
function normalizeDomain(raw) {
  if (!raw) return 'Domínio Não Especificado';
  let d = String(raw).normalize('NFC').trim();
  const low = d.toLowerCase();
  if (low.includes('promo')) return 'Promoção da saúde';
  if (low.includes('nutri')) return 'Nutrição';
  if (low.includes('elimina')||low.includes('troca')) return 'Eliminação e troca';
  if (low.includes('atividade')||low.includes('repouso')||low.includes('descanso')) return 'Atividade/Repouso';
  if (low.includes('percep')||low.includes('cogni')) return 'Percepção / Cognição';
  if (low.includes('autopercep')||low.includes('autoconceito')) return 'Autopercepção';
  if (low.includes('papel')||low.includes('rela')||low.includes('familia')) return 'Papéis e Relações';
  if (low.includes('sexual')) return 'Sexualidade';
  if (low.includes('enfrent')||low.includes('toler')||low.includes('estress')) return 'Enfrentamento / Tolerância ao estresse';
  if (low.includes('confort')) return 'Conforto';
  if (low.includes('cresci')||low.includes('desenvolv')) return 'Crescimento / Desenvolvimento';
  if (low.includes('princ')) return 'Princípios de vida';
  if (low.includes('seguran')||low.includes('prote')) return 'Segurança / Proteção';
  return d;
}

// Extrai número do domínio para ordenação
function domainNumber(raw) {
  let m = String(raw).match(/dom[ií]nio\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 999;
}

// Agrupa por domínio e serializa como JS
const domainMap = {};
bancoNanda.forEach(d => {
  const dom = normalizeDomain(d.dominio);
  if (!domainMap[dom]) domainMap[dom] = { num: domainNumber(d.dominio), items: [] };
  domainMap[dom].items.push(d);
});

const domainKeys = Object.keys(domainMap).sort((a,b) => {
  if (domainMap[a].num !== domainMap[b].num) return domainMap[a].num - domainMap[b].num;
  return a.localeCompare(b, 'pt-BR');
});

// Serializa dados NANDA como array JS
let nandaDataJS = '[\n';
domainKeys.forEach((dom, di) => {
  const items = domainMap[dom].items;
  nandaDataJS += `  {"domain":"${jsStr(dom)}","num":${domainMap[dom].num},"items":[\n`;
  items.forEach((item, ii) => {
    nandaDataJS += `    {"codigo":"${jsStr(item.codigo||'')}","diagnostico":"${jsStr(item.diagnostico||'')}","classe":"${jsStr(item.classe||'')}","definicao":"${jsStr(item.definicao||'')}","caracteristicas":${JSON.stringify(item.caracteristicas_definidoras||[])}, "fatores":${JSON.stringify(item.fatores_relacionados||[])}}`;
    if (ii < items.length - 1) nandaDataJS += ',';
    nandaDataJS += '\n';
  });
  nandaDataJS += '  ]}';
  if (di < domainKeys.length - 1) nandaDataJS += ',';
  nandaDataJS += '\n';
});
nandaDataJS += ']';

// Serializa dados NIC como array JS (primeiros 300, mais relevantes)
const nicSample = bancoNic.slice(0, 300);
let nicDataJS = '[\n';
nicSample.forEach((item, i) => {
  nicDataJS += `  {"codigo":"${jsStr(item.codigo||'')}","intervencao":"${jsStr(item.intervencao||'')}","definicao":"${jsStr(item.definicao||'')}","atividades":${JSON.stringify(item.atividades||[])}}`;
  if (i < nicSample.length - 1) nicDataJS += ',';
  nicDataJS += '\n';
});
nicDataJS += ']';

const mainJS = `
<script>
(function(){
// ===== DADOS =====
var nandaData = ${nandaDataJS};
var nicData = ${nicDataJS};

// ===== RENDER NANDA =====
var accordionEl = document.getElementById('nanda-accordion');
var detailEl = document.getElementById('nanda-detail');
var selectedDiag = null;
var totalDiags = 0;

nandaData.forEach(function(d){ totalDiags += d.items.length; });

document.getElementById('badge-dominios').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-3 h-3" fill="currentColor" style="color:#1a3e74"><path d="M264.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 149.8C37.4 145.8 32 137.3 32 128s5.4-17.9 13.9-21.8L264.5 5.2z"/></svg> ' + nandaData.length + ' Domínios';
document.getElementById('badge-diagnosticos').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-3 h-3" fill="currentColor" style="color:#1a3e74"><path d="M96 352L96 96c0-35.3 28.7-64 64-64l256 0c35.3 0 64 28.7 64 64l0 197.5c0 17-6.7 33.3-18.7 45.3l-58.5 58.5c-12 12-28.3 18.7-45.3 18.7L160 416c-35.3 0-64-28.7-64-64zM272 128c-8.8 0-16 7.2-16 16l0 48-48 0c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l48 0 0 48c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-48 48 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-48 0 0-48c0-8.8-7.2-16-16-16l-32 0z"/></svg> ' + totalDiags + ' Diagnósticos';

accordionEl.innerHTML = '';
nandaData.forEach(function(domain, di){
  var card = document.createElement('div');
  card.className = 'card-nanda';
  var header = document.createElement('div');
  header.className = 'domain-header';
  header.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span style="background:#eff6ff;color:#1a3e74;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px">' + (di+1) + '</span>' + domain.domain + '</span><span class="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-bold">' + domain.items.length + '</span>';
  var content = document.createElement('div');
  content.className = 'domain-content';

  domain.items.forEach(function(item){
    var row = document.createElement('div');
    row.className = 'diag-item';
    row.innerHTML = '<div><span class="text-[10px] font-black text-gray-400 block">CÓDIGO: ' + (item.codigo||'N/A') + '</span><p class="text-sm font-bold text-gray-800 leading-tight">' + item.diagnostico + '</p></div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="text-gray-300 text-xs" fill="currentColor" width="1em" height="1em"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
    row.addEventListener('click', function(e){
      e.stopPropagation();
      showDetail(item);
      // highlight
      document.querySelectorAll('.diag-item.active').forEach(function(el){ el.classList.remove('active'); });
      row.classList.add('active');
    });
    content.appendChild(row);
  });

  header.addEventListener('click', function(){
    content.classList.toggle('open');
  });

  card.appendChild(header);
  card.appendChild(content);
  accordionEl.appendChild(card);
});

function showDetail(item){
  var caracHtml = '';
  if (item.caracteristicas && item.caracteristicas.length > 0){
    caracHtml = '<h4 class="font-bold text-sm mt-4 mb-2" style="color:#1a3e74">Características Definidoras:</h4><div class="flex flex-wrap gap-1">';
    item.caracteristicas.forEach(function(c){ caracHtml += '<span class="tag">' + c + '</span>'; });
    caracHtml += '</div>';
  }
  var fatHtml = '';
  if (item.fatores && item.fatores.length > 0){
    fatHtml = '<h4 class="font-bold text-sm mt-4 mb-2" style="color:#b45309">Fatores Relacionados:</h4><div class="flex flex-wrap gap-1">';
    item.fatores.forEach(function(f){ fatHtml += '<span class="tag tag-amber">' + f + '</span>'; });
    fatHtml += '</div>';
  }
  detailEl.innerHTML = '<div><span class="text-xs font-black text-gray-400 uppercase tracking-wider">CÓDIGO: ' + (item.codigo||'N/A') + '</span><h3 class="text-xl font-black mt-1 mb-3" style="color:#1a3e74">' + item.diagnostico + '</h3><p class="text-sm text-gray-600 mb-2"><strong>Domínio:</strong> ' + (item.domain||'') + '</p><p class="text-sm text-gray-600 mb-2"><strong>Classe:</strong> ' + (item.classe||'N/A') + '</p><p class="text-sm text-gray-700"><strong>Definição:</strong> ' + (item.definicao||'N/A') + '</p>' + caracHtml + fatHtml + '</div>';
}

// ===== RENDER NIC =====
var nicListEl = document.getElementById('nic-list');
var nicDetailEl = document.getElementById('nic-detail');
var nicSearchEl = document.getElementById('nic-search');
var selectedNic = null;

document.getElementById('badge-nic-total').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-3 h-3" fill="currentColor" style="color:#1a3e74"><path d="M264.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 149.8C37.4 145.8 32 137.3 32 128s5.4-17.9 13.9-21.8L264.5 5.2z"/></svg> ' + nicData.length + ' Intervenções';

function renderNicList(filter){
  nicListEl.innerHTML = '';
  var term = (filter||'').toLowerCase().trim();
  var filtered = nicData;
  if (term.length >= 2){
    filtered = nicData.filter(function(n){
      return (n.intervencao||'').toLowerCase().includes(term) || (n.definicao||'').toLowerCase().includes(term) || String(n.codigo).includes(term);
    });
  }
  if (filtered.length === 0){
    nicListEl.innerHTML = '<div class="text-center p-8"><p class="font-bold text-gray-500">Nenhuma intervenção encontrada.</p></div>';
    return;
  }
  filtered.forEach(function(nic){
    var item = document.createElement('div');
    item.className = 'nic-item';
    item.innerHTML = '<span class="text-[10px] font-black text-gray-400 block">CÓD: ' + nic.codigo + '</span><span class="text-sm font-bold text-gray-800">' + nic.intervencao + '</span>';
    item.addEventListener('click', function(){
      showNicDetail(nic);
      document.querySelectorAll('.nic-item.active').forEach(function(el){ el.classList.remove('active'); });
      item.classList.add('active');
    });
    nicListEl.appendChild(item);
  });
}

function showNicDetail(nic){
  var actHtml = '';
  if (nic.atividades && nic.atividades.length > 0){
    actHtml = '<h4 class="font-bold text-sm mt-4 mb-2" style="color:#1a3e74">Atividades (' + nic.atividades.length + '):</h4><ul class="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">';
    nic.atividades.forEach(function(a){ actHtml += '<li>' + a + '</li>'; });
    actHtml += '</ul>';
  }
  nicDetailEl.innerHTML = '<div><span class="text-xs font-black text-gray-400 uppercase tracking-wider">CÓDIGO: ' + nic.codigo + '</span><h3 class="text-xl font-black mt-1 mb-3" style="color:#1a3e74">' + nic.intervencao + '</h3><p class="text-sm text-gray-700"><strong>Definição:</strong> ' + (nic.definicao||'N/A') + '</p>' + actHtml + '</div>';
}

nicSearchEl.addEventListener('input', function(){ renderNicList(this.value); });
renderNicList('');

})();
</script>
`;

// Monta o HTML final
const htmlCompleto = head + extraCSS + headClose + bodyOpen + mainJS + footer + '\n</body></html>';

fs.writeFileSync(path.join(__dirname, 'nanda.html'), htmlCompleto, 'utf8');
console.log('✅ nanda.html gerado com sucesso!');
console.log('   Tamanho:', (htmlCompleto.length / 1024).toFixed(1), 'KB');
console.log('   Domínios NANDA:', domainKeys.length);
console.log('   Diagnósticos:', bancoNanda.length);
console.log('   Intervenções NIC (amostra):', nicSample.length);
