// Teste de validação da reformulação de checagem.html (padrão integracoes_classificacao_wifi.html)
// Checks: estrutura full-width, mídia alternada, lightbox acessível, referências, CWV e mobile.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const file = path.join(__dirname, '..', 'checagem.html');
const html = fs.readFileSync(file, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const doc = dom.window.document;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('\u2714 ' + name); }
  else { fail++; console.log('X ' + name); }
}

// 1. Estrutura main sem container (regra HTML_RULES.md)
const main = doc.getElementById('main-content');
check('main com flex-grow p-4 sm:p-8', main && /flex-grow\s+p-4\s+sm:p-8/.test(main.className));
check('sem max-w-* / container / mx-auto no main', !/max-w-|container|mx-auto/.test(main.className));
check('sem max-w-* / container / mx-auto em todo o body', !/max-w-5xl|max-w-6xl|max-w-7xl|mx-auto|class="container"/.test(doc.body.outerHTML));

// 2. Card + article-content (padrão integracoes)
const article = doc.querySelector('.article-content');
check('.wifi-card envolve o conteudo', !!doc.querySelector('.wifi-card'));
check('.article-content presente dentro do card', article && !!article.closest('.wifi-card'));

// 3. Mídia alternada
const rows = doc.querySelectorAll('.media-row');
check('12 blocos de midia alternada', rows.length === 12);
let alternaOk = true;
rows.forEach((r, i) => { const alt = r.classList.contains('alt'); if (alt !== (i % 2 === 1)) alternaOk = false; });
check('imagens alternam lateralidade (L, R, L, R...)', alternaOk);
check('cada linha tem 1 figura + 1 corpo', Array.from(rows).every(r => r.querySelectorAll('.media-fig').length === 1 && r.querySelectorAll('.media-body').length === 1));
check('figura e o primeiro filho em todas as linhas (alternancia via row-reverse)', Array.from(rows).every(r => r.firstElementChild && r.firstElementChild.classList.contains('media-fig')));

// 4. Acessibilidade e CWV nas imagens
const imgs = doc.querySelectorAll('.media-row img');
check('12 imagens de conteudo', imgs.length === 12);
check('todas com alt nao vazio', Array.from(imgs).every(i => (i.getAttribute('alt') || '').trim().length > 0));
check('todas com width e height (anti-CLS)', Array.from(imgs).every(i => i.getAttribute('width') && i.getAttribute('height')));
check('todas com loading=lazy', Array.from(imgs).every(i => i.getAttribute('loading') === 'lazy'));
check('todas com decoding=async', Array.from(imgs).every(i => i.getAttribute('decoding') === 'async'));
check('todas com data-zoom', Array.from(imgs).every(i => i.hasAttribute('data-zoom')));
check('todas focaveis (tabindex=0, role=button)', Array.from(imgs).every(i => i.getAttribute('tabindex') === '0' && i.getAttribute('role') === 'button'));
check('todas com aria-label descritivo', Array.from(imgs).every(i => (i.getAttribute('aria-label') || '').length > 8));

// 5. Sem resquícios do layout antigo
check('sem classe .content-image', !doc.querySelector('.content-image'));
check('sem classe font-inter no body/conteudo', !/font-inter|text-black-custom/.test(html));
check('sem texto artefato "in>" vazando no body', !doc.body.textContent.includes('in>'));

// 6. Hero preservado (regra HTML_RULES.md)
const h1 = doc.querySelector('main h1');
check('hero com h1 clamp + font-black', h1 && /clamp\(28px,5vw,44px\)/.test(h1.className) && h1.classList.contains('font-black'));
check('hero com eyebrow (text-xs uppercase)', !!doc.querySelector('main section p.text-xs.uppercase'));

// 7. Referencias Bibliograficas (regra oficial)
const refs = doc.querySelector('.refs-section');
const refsH2 = refs ? refs.querySelector('h2') : null;
const refsOl = refs ? refs.querySelector('ol') : null;
const refsLi = refs ? refs.querySelectorAll('ol li') : [];
check('secao .refs-section no fim do artigo', refs && refs.closest('.article-content'));
check('titulo H2 "Referencias Bibliograficas"', refsH2 && /Refer.ncias Bibliogr.ficas/.test(refsH2.textContent));
check('lista numerada (ol) com 4 itens', refsOl && refsLi.length === 4);
check('cada referencia tem link ao final', Array.from(refsLi).every(li => !!li.querySelector('a') && li.querySelector('a').getAttribute('href').startsWith('http')));

// 8. Lightbox
const lb = doc.getElementById('lightbox');
const lbImg = doc.getElementById('lightboxImg');
const lbClose = doc.getElementById('lightboxClose');
check('lightbox presente com role=dialog e aria-modal', lb && lb.getAttribute('role') === 'dialog' && lb.getAttribute('aria-modal') === 'true');
check('lightbox inicia oculto (hidden)', lb && lb.hasAttribute('hidden'));
check('lightbox tem botao de fechar com aria-label', lbClose && lbClose.getAttribute('aria-label'));
check('lightbox tem img de destino', lbImg && lbImg.id === 'lightboxImg');
const script = Array.from(doc.querySelectorAll('script')).map(s => s.textContent).join('\n');
check('JS abre lightbox no clique', /openLightbox/.test(script) && /img\.addEventListener\('click'/.test(script));
check('JS fecha clicando fora (target===lb)', /e\.target === lb/.test(script));
check('JS fecha com ESC', /key === 'Escape'/.test(script));
check('JS abre com Enter/Espaco (teclado)', /key === 'Enter' \|\| e\.key === ' '/.test(script));

// 9. CSS: padrao integracoes + mobile
check('body 13px Inter (padrao integracoes)', /body\{font-family:'Inter',sans-serif;font-size:13px\}/.test(html));
check('h2 do artigo 18px/900 com borda navy', /\.article-content h2\{font-size:18px;font-weight:900/.test(html));
check('media-row alternada (row-reverse)', /\.media-row\.alt\{flex-direction:row-reverse\}/.test(html));
check('media query mobile <=768px empilha linhas', /@media\(max-width:768px\)\{[\s\S]*\.media-row,\.media-row\.alt\{flex-direction:column/.test(html));
check('imagens mobile com max-height 360px', /\.media-fig img\{max-height:360px/.test(html));
check('referencias com fonte 16px', /\.refs-section li\{font-size:16px;font-weight:400;color:#374151/.test(html));
check('lightbox oculto via [hidden]', /\.lightbox\[hidden\]\{display:none\}/.test(html));
check('viewport meta presente', !!doc.querySelector('meta[name="viewport"]'));

// 10. JSON-LD continua valido
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
check('JSON-LD presente', !!ldMatch);
if (ldMatch) {
  try { JSON.parse(ldMatch[1]); check('JSON-LD valido', true); }
  catch (e) { check('JSON-LD valido', false); }
}

// 11. Sem rolagem horizontal forçada (sem larguras fixas grandes)
check('sem width fixo > 900px em elementos do conteudo', !/width:\s*9\d\dpx/.test(html));

console.log('\nTotal checks: ' + (pass + fail) + ' Failures: ' + fail);
process.exit(fail === 0 ? 0 : 1);
