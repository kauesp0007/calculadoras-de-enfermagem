/* Recursos compartilhados do Fórum Multilíngue: grade, avatares, tradução PT/EN/ES. */
(function(){
'use strict';
var avatars=[
{src:'/imagens/enfermeira-de-mascara-svg.png',label:'Enfermeira com máscara'},
{src:'/imagens/cirurgiao-svg.png',label:'Cirurgião'},
{src:'/imagens/enfermeira-perfil-svg.png',label:'Enfermeira de perfil'},
{src:'/imagens/enfermeira-svg.png',label:'Enfermeira'},
{src:'/imagens/enfermeiro-svg.png',label:'Enfermeiro'}
];
function escapeAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function avatar(post){
var n=Number(post.avatar_id);
if(!Number.isInteger(n)||n<1||n>5)n=(Number(post.id)||0)%5+1;
return avatars[n-1].src;
}
function picker(name,lang){
var label=lang==='es'?'Elige tu avatar':lang==='en'?'Choose your avatar':'Escolha seu avatar';
return '<fieldset class="avatar-picker"><legend>'+label+'</legend><div class="avatar-options">'+avatars.map(function(a,i){
return '<label class="avatar-choice" title="'+escapeAttr(a.label)+'"><input type="radio" name="'+name+'" value="'+(i+1)+'" aria-label="'+escapeAttr(a.label)+'"'+(i===0?' checked':'')+'><img src="'+a.src+'" alt="" width="40" height="40" loading="lazy" decoding="async"></label>';
}).join('')+'</div></fieldset>';
}
function selected(name){var input=document.querySelector('input[name="'+name+'"]:checked');return input?Number(input.value):1;}
function tone(id){return Number(id)%2===0?'post-tone-blue':'post-tone-purple';}
function label(lang){return lang==='pt'?'Traduzir':lang==='es'?'Traducir':'Translate';}
function renderSequential(feed,all,filter,renderPost){
var byId=Object.create(null), roots=[];
all.forEach(function(p){byId[p.id]=Object.assign({},p,{children:[]});});
all.forEach(function(p){
if(p.parent_id&&byId[p.parent_id]&&String(p.id)!==String(p.parent_id)){byId[p.parent_id].children.push(byId[p.id]);}
else {roots.push(byId[p.id]);}
});
function orderReplies(items){
items.sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);});
items.forEach(function(p){orderReplies(p.children);});
}
function countReplies(p){return p.children.reduce(function(n,c){return n+1+countReplies(c);},0);}
roots.forEach(function(p){orderReplies(p.children);});
if(filter==='comentados')roots.sort(function(a,b){return countReplies(b)-countReplies(a)||new Date(b.created_at)-new Date(a.created_at);});
else roots.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
var fragment=document.createDocumentFragment();
roots.forEach(function(p){fragment.appendChild(renderPost(p,false));});
feed.replaceChildren(fragment);
}
async function translatePost(id,btn,target,all,request,renderText,showToast,lang){
if(['pt','en','es'].indexOf(target)<0)return;
var post=all.find(function(p){return String(p.id)===String(id);});
var card=btn.closest('.post');
if(!post||!post.conteudo||!card)return;
var prev=Array.from(card.children).find(function(e){return e.classList&&e.classList.contains('traducao');});
if(prev&&prev.getAttribute('data-lang')===target){prev.remove();return;}
if(btn.dataset.translating==='true')return;
btn.dataset.translating='true';
btn.classList.add('translating');
var labelBefore=btn.textContent;
btn.textContent=lang==='es'?'Traduciendo…':lang==='pt'?'Traduzindo…':'Translating…';
try{
var translated=await request(post,target);
var labelByLang={pt:'Português',en:'English',es:'Español'};
var translatedPanel=document.createElement('div');
translatedPanel.className='traducao';
translatedPanel.setAttribute('data-lang',target);
var head=document.createElement('span');head.className='tlabel';
head.textContent=(lang==='es'?'Traducción':lang==='pt'?'Tradução':'Translation')+' — '+labelByLang[target];
translatedPanel.appendChild(head);
var body=document.createElement('div');
body.innerHTML=renderText(translated);
translatedPanel.appendChild(body);
if(prev)prev.remove();
var actions=Array.from(card.children).find(function(e){return e.classList&&e.classList.contains('actions');});
if(actions)actions.insertAdjacentElement('afterend',translatedPanel);
var langs=btn.closest('.translate-control').querySelector('.translation-langs');
if(langs)langs.hidden=true;
}catch(error){
showToast('Não foi possível traduzir esta mensagem agora. · Could not translate this message right now.');
console.error('Fórum tradução:',error);
}finally{
delete btn.dataset.translating;btn.classList.remove('translating');btn.textContent=labelBefore;
}
}
window.ForumUI={avatar:avatar,picker:picker,selected:selected,tone:tone,translateLabel:label,renderSequential:renderSequential,translatePost:translatePost};
})();
