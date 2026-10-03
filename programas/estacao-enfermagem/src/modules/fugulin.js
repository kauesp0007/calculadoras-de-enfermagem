(function(root,factory){ const mod=factory(); if(typeof module==='object'&&module.exports) module.exports=mod; else { root.NursingModules ||= {}; root.NursingModules.fugulin=mod; } })(typeof globalThis==='object'?globalThis:this,()=>{
'use strict';
const CRITERIA=[
['estado_mental','Estado mental','Consciência e orientação.',['Orientação no tempo e no espaço','Episódios de desorientação','Episódios de inconsciência','Inconsciência']],
['oxigenacao','Oxigenação','Necessidade de suplementação de oxigênio.',['Sem suplementação de oxigênio','Oxigênio por máscara ou cateter de forma intermitente','Oxigênio por máscara ou cateter de forma contínua','Ventilação mecânica']],
['sinais_vitais','Sinais vitais','Intervalo necessário de monitorização.',['Controle de rotina','Controle a cada 6 horas','Controle a cada 4 horas','Controle a cada 2 horas ou intervalo menor']],
['motilidade','Motilidade','Movimentação dos segmentos corporais.',['Move todos os segmentos corporais','Apresenta limitação de movimentos','Dificuldade para mover segmentos; necessita auxílio na mudança de posição','Não move segmentos; mudança de posição e movimentação pela enfermagem']],
['deambulacao','Deambulação','Capacidade e meio de locomoção.',['Deambula sem auxílio','Precisa de auxílio para deambular','Locomove-se em cadeira de rodas','Restrito ao leito']],
['alimentacao','Alimentação','Via e necessidade de auxílio.',['Autossuficiente','Alimentação oral com auxílio','Alimentação por sonda gástrica','Alimentação por cateter central']],
['cuidado_corporal','Cuidado corporal','Higiene corporal e oral.',['Autossuficiente','Precisa de auxílio no banho e/ou higiene oral','Banho no chuveiro e higiene oral realizados pela enfermagem','Banho no leito e higiene oral realizados pela enfermagem']],
['eliminacao','Eliminação','Necessidade de auxílio nas eliminações.',['Autossuficiente','Vaso sanitário com auxílio','Comadre ou eliminações no leito','Evacuação no leito e sonda vesical para controle da diurese']],
['terapeutica','Terapêutica','Via e continuidade do tratamento.',['Via oral ou intramuscular','Via intravenosa intermitente','Via intravenosa contínua ou por sonda nasogástrica','Drogas vasoativas para manutenção da pressão arterial']],
['integridade','Integridade cutâneo-mucosa','Comprometimento tecidual.',['Pele íntegra','Alteração de cor e/ou lesão de epiderme e/ou derme','Lesão de tecido subcutâneo e muscular; incisão cirúrgica, ostomia ou dreno','Destruição de tecidos e estruturas de suporte, como tendões/cápsulas; evisceração']],
['curativo','Curativos','Trocas realizadas pela enfermagem em 24 horas.',['Sem curativo ou limpeza feita pelo paciente no banho','Curativo realizado uma vez por dia','Curativo realizado duas vezes por dia','Curativo realizado três vezes por dia ou mais']],
['tempo_curativo','Tempo de curativos','Tempo médio necessário para realizar os curativos.',['Sem curativo','Entre 5 e 15 minutos','Entre 15 e 30 minutos','Mais de 30 minutos']]
].map(([id,name,desc,texts])=>({id,name,desc,options:texts.map((text,i)=>({value:i+1,text}))}));
const CLASSES=[
{id:'minimos',min:12,max:17,name:'Cuidados mínimos',hours:4,color:'#047857'},
{id:'intermediarios',min:18,max:22,name:'Cuidados intermediários',hours:6,color:'#a16207'},
{id:'alta_dependencia',min:23,max:28,name:'Alta dependência',hours:10,color:'#c2410c'},
{id:'semi_intensivos',min:29,max:34,name:'Cuidados semi-intensivos',hours:10,color:'#b91c1c'},
{id:'intensivos',min:35,max:48,name:'Cuidados intensivos',hours:18,color:'#6d28d9'}];
function progress(scores={}){return CRITERIA.filter(c=>Number.isInteger(scores[c.id])&&scores[c.id]>=1&&scores[c.id]<=4).length;}
function calculate(scores){if(!scores||typeof scores!=='object'||Array.isArray(scores)||progress(scores)!==12)throw new Error('Preencha as 12 áreas com pontuações de 1 a 4.'); if(Object.keys(scores).some(k=>!CRITERIA.some(c=>c.id===k)))throw new Error('Critério desconhecido.');const total=CRITERIA.reduce((n,c)=>n+scores[c.id],0);return {total,...CLASSES.find(c=>total>=c.min&&total<=c.max),moduleId:'fugulin',moduleVersion:'2.0.0'};}
function priorities(scores){return CRITERIA.filter(c=>scores[c.id]>=3).map(c=>({name:c.name,score:scores[c.id],selected:c.options.find(o=>o.value===scores[c.id]).text}));}
return Object.freeze({id:'fugulin',version:'2.0.0',name:'Escala de Fugulin',population:'Adultos',criteria:CRITERIA,classes:CLASSES,calculate,progress,priorities,sources:[{title:'Santos et al. (2007) — Instrumento complementado de Fugulin',url:'https://doi.org/10.1590/S0104-11692007000500015'},{title:'COFEN — Parecer Normativo nº 1/2024',url:'https://www.cofen.gov.br/parecer-normativo-no-1-2024-cofen/'},{title:'COFEN — Resolução nº 743/2024',url:'https://www.cofen.gov.br/resolucao-cofen-no-743-de-12-de-marco-de-2024/'}]});
});
