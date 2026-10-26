// Regression checks with an isolated DOM fixture; does not replace browser QA.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class Element{
 constructor(v={}){Object.assign(this,{value:'',checked:false,hidden:false,disabled:false,innerHTML:'',textContent:'',innerText:'',style:{},listeners:{},isConnected:true},v);this.classes=new Set((v.classes||'').split(' '));this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x),toggle:(x,b)=>{const on=b===undefined?!this.classes.has(x):b;on?this.classes.add(x):this.classes.delete(x);return on}};this.parentNode={insertBefore(){}};}
 addEventListener(t,f){(this.listeners[t]??=[]).push(f)}
 fire(t){for(const f of this.listeners[t]||[])f.call(this,{preventDefault(){}})}
 focus(){} scrollIntoView(){} remove(){}
}

const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'escala_de_trabalho_enfermagem_12x36.html'),'utf8');
const fixtures={};
for(const m of html.matchAll(/<[a-z][a-z0-9]*\b[^>]*\bid="([^"]+)"[^>]*>/gi)){
 const tag=m[0];fixtures[m[1]]={value:tag.match(/\bvalue="([^"]*)"/)?.[1]||'',checked:/\schecked(?:\s|>)/.test(tag),hidden:/\shidden(?:\s|>)/.test(tag),classes:tag.match(/\bclass="([^"]*)"/)?.[1]||''};
}
for(const m of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi)){
 const options=[...m[2].matchAll(/<option\b([^>]*)>/g)];const option=options.find(o=>/\bselected\b/.test(o[1]))||options[0];fixtures[m[1]].value=option[1].match(/\bvalue="([^"]*)"/)?.[1]||'';
}
const appScript=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('// Estado da Aplicação'))[1];

(function testApplication(){
const nodes=Object.fromEntries(Object.entries(fixtures).map(([id,v])=>[id,new Element(v)]));
const radios=['none','Férias','Auxílio Doença','Licença Maternidade'].map(value=>new Element({value,checked:value==='none'}));
const doc={getElementById:id=>{assert.ok(nodes[id],'missing DOM '+id);return nodes[id]},querySelectorAll:()=>[],querySelector:s=>s.includes('afastamento')?radios[0]:nodes.escalaAfastamentos,getElementsByName:()=>radios,createElement:()=>new Element()};
const context={document:doc,window:{},localStorage:{},Date,alert(){},setTimeout:f=>f()};vm.runInNewContext(appScript,context);
let checks=0;const check=(label,fn)=>{fn();checks++;console.log('PASS '+label)};
const html=()=>nodes.escalasContainer.innerHTML;
const tables=()=>html().split('<div class="table-container').slice(1);
check('four empty tables immediately after initialization',()=>{assert.equal(tables().length,4);assert.equal((html().match(/Nenhum colaborador/g)||[]).length,4);assert.ok(nodes.dimensionamentoCard.classList.contains('hidden'));});
nodes.configAno.value='2024';nodes.configMes.value='1';nodes.configMes.fire('change');
check('February leap year has 29 days in each calendar',()=>tables().forEach(t=>assert.equal((t.match(/<th class="col-dia/g)||[]).length,58)));
nodes.configAno.value='';nodes.configAno.fire('change');
check('incomplete year preserves valid tables',()=>assert.equal(tables().length,4));nodes.configAno.value='2024';
for(const id of ['chkDiaPar','chkDiaImpar','chkNoitePar','chkNoiteImpar'])nodes[id].checked=false;nodes.chkDiaPar.fire('change');
check('no selected teams gives instruction and can recover',()=>assert.ok(html().includes('Selecione pelo menos')));
for(const id of ['chkDiaPar','chkDiaImpar','chkNoitePar','chkNoiteImpar'])nodes[id].checked=true;nodes.chkDiaPar.fire('change');
function add(name,turn,regime,func='ENF',away='none',folga=''){
 Object.assign(nodes.staffNome,{value:name});nodes.staffTurno.value=turn;nodes.staffRegime.value=regime;nodes.staffFuncao.value=func;nodes.staffCoren.value='123<456';nodes.staffFolga1.value=folga;radios.forEach(r=>r.checked=r.value===away);nodes.btnAddStaff.fire('click');}
add('Pessoa A','Dia','Par','ENF','none','2');add('Pessoa B','Dia','Impar','TEC');add('Pessoa C','Noite','Par','AUX');add('Pessoa D','Noite','Impar','ENF','Licença Maternidade');
check('each staff member goes only to their own shift/parity table',()=>tables().forEach((t,i)=>{for(let j=0;j<4;j++)assert.equal(t.includes('PESSOA '+String.fromCharCode(65+j)),i===j)}));
check('leave, normal shifts and selected day off remain functional',()=>{assert.match(tables()[0],/dia-folga[^>]*>F</);assert.match(tables()[0],/dia-plantao[^>]*>P</);assert.ok(tables()[3].includes('colspan="29" class="linha-afastamento">Licença Maternidade'));});
check('table sections close tbody before tfoot',()=>tables().forEach(t=>assert.ok(t.indexOf('</tbody>')<t.indexOf('<tfoot>'))));
nodes.configInstituicao.value='<img src=x onerror=alert(1)>';nodes.configInstituicao.fire('input');add('<script>exemplo</script>','Dia','Par');
check('institution, name and COREN are escaped as text',()=>{assert.ok(!html().includes('<script>exemplo'));assert.ok(html().includes('&lt;SCRIPT&gt;EXEMPLO&lt;/SCRIPT&gt;'));assert.ok(html().includes('123&lt;456'));assert.ok(!html().includes('<IMG SRC='));});
for(let i=0;i<5;i++)nodes.btnLimparStaff.fire('click');
check('removing last staff retains four empty tables and zero metrics',()=>{assert.equal(tables().length,4);assert.equal((html().match(/Nenhum colaborador/g)||[]).length,4);assert.equal(nodes.resEnfermeiros.textContent,0);});
const cell=new Element({innerText:'P'});context.window.toggleCellState(cell,true);assert.equal(cell.innerText,'FF');context.window.toggleCellState(cell,true);assert.equal(cell.innerText,'E');context.window.toggleCellState(cell,true);assert.equal(cell.innerText,'F');context.window.toggleCellState(cell,true);assert.equal(cell.innerText,'P');
check('manual P/FF/E/F cycle preserved',()=>assert.equal(cell.innerText,'P'));
console.log(JSON.stringify({functionalChecks:checks,status:'PASS',runtime:'Node VM with DOM fixture; not browser'}));

})();
(function testTutorial(){
const source=fs.readFileSync(path.join(root,'js/escala-12x36-tutorial.js'),'utf8');
function setup(stored=false){
 const store=new Map(stored?[['escala12x36:tutorial:v1:fechado','1']]:[]),events={},frames=[];
 const nodes=Object.fromEntries(Object.entries(fixtures).map(([id,v])=>[id,new Element(v)]));
 const header=new Element();header.getBoundingClientRect=()=>({top:36,bottom:96,height:60});
 const win={innerWidth:1366,innerHeight:800,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},getComputedStyle:()=>({display:'block',visibility:'visible'}),addEventListener:(t,f)=>{(events[t]??=new Set()).add(f)},removeEventListener:(t,f)=>events[t]?.delete(f),requestAnimationFrame:f=>{frames.push(f);return frames.length},cancelAnimationFrame(){}};
 Object.entries(nodes).forEach(([id,el],i)=>{el.setAttribute=(k,v)=>el[k]=v;el.getBoundingClientRect=()=>({left:30+i%3*100,right:180+i%3*100,top:240,bottom:280,height:40});});
 Object.defineProperty(nodes.escalaTutorial,'offsetWidth',{get:()=>Math.min(340,win.innerWidth-24)});
 Object.defineProperty(nodes.escalaTutorial,'offsetHeight',{get:()=>Math.min(250,parseFloat(nodes.escalaTutorial.style.maxHeight)||250)});
 const doc={body:new Element(),activeElement:null,getElementById:id=>nodes[id],querySelector:s=>nodes[s.slice(1)],querySelectorAll:()=>[header],addEventListener:(t,f)=>{(events[t]??=new Set()).add(f)}};doc.activeElement=doc.body;
 vm.runInNewContext(source,{document:doc,window:win});const flush=()=>{while(frames.length)frames.shift()()};flush();return {win,nodes,events,store,flush};
}
let checks=0;const check=(label,fn)=>{fn();checks++;console.log('PASS '+label)};
const a=setup();const n=a.nodes;
check('first visit opens nonmodal tutorial',()=>{assert.equal(n.escalaTutorial.hidden,false);assert.equal(n.escalaTutorialPasso.textContent,'Passo 1 de 9');assert.equal(n.escalaTutorialAnterior.disabled,true)});
for(let i=1;i<9;i++){n.escalaTutorialProximo.fire('click');a.flush();assert.equal(n.escalaTutorialPasso.textContent,`Passo ${i+1} de 9`);assert.equal(Object.values(n).filter(e=>e.classList.contains('escala-tour-target')).length,1);}
check('next traverses nine distinct contextual steps',()=>assert.equal(n.escalaTutorialProximo.textContent,'Concluir'));
n.escalaTutorialAnterior.fire('click');a.flush();check('previous goes back to correct target',()=>assert.equal(n.escalaTutorialPasso.textContent,'Passo 8 de 9'));
a.win.innerWidth=320;a.win.innerHeight=568;for(const f of a.events.resize)f();a.flush();
check('mobile positioning clamps card inside viewport below header',()=>{const left=parseFloat(n.escalaTutorial.style.left),top=parseFloat(n.escalaTutorial.style.top);assert.ok(left>=12);assert.ok(left+n.escalaTutorial.offsetWidth<=308);assert.ok(top>=108);assert.ok(top+n.escalaTutorial.offsetHeight<=556)});
n.escalaTutorialFechar.fire('click');check('close removes target and listeners, keeps reopen control',()=>{assert.equal(n.escalaTutorial.hidden,true);assert.equal(n.escalaTutorialAbrir.hidden,false);assert.equal(a.events.scroll.size,0);assert.equal(Object.values(n).filter(e=>e.classList.contains('escala-tour-target')).length,0);assert.equal(a.store.get('escala12x36:tutorial:v1:fechado'),'1')});
n.escalaTutorialAbrir.fire('click');a.flush();check('reopen restarts at first step',()=>assert.equal(n.escalaTutorialPasso.textContent,'Passo 1 de 9'));
for(const f of a.events.keydown)f({key:'Escape'});check('Escape closes tutorial',()=>assert.equal(n.escalaTutorial.hidden,true));
const b=setup(true);check('dismissed tutorial stays closed next visit',()=>assert.equal(b.nodes.escalaTutorial.hidden,true));
console.log(JSON.stringify({tutorialChecks:checks,status:'PASS',runtime:'Node VM DOM fixture; not browser'}));

})();
