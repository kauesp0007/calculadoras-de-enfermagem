"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
function control(tag, text, attributes={}) {
  return {
    tagName:tag, id:"", className:"", textContent:text,
    getAttribute:name=>attributes[name]??null,
    hasAttribute:name=>Object.prototype.hasOwnProperty.call(attributes,name),
    closest(selector) {
      if(selector.startsWith("button,a,"))return this;
      if(selector==='[data-premium-print="block"]'&&attributes["data-premium-print"]==="block")return this;
      return null;
    }, click(){this.replayed=(this.replayed||0)+1;}
  };
}
function harness(premium, language) {
  const handlers={};const redirects=[];let prints=0;
  const auth={currentUser:()=>premium?{}:null,hasPlan:()=>premium,billingStatus:()=>({resolved:true,plan:premium?"premium":"free"})};
  const window={location:{pathname:"/"+language+"/index.html",search:"",hash:"",origin:"https://site.test",href:"https://site.test/"+language+"/index.html",assign:url=>redirects.push(url)},
    print:()=>{prints++;},__ENSURE_AUTH:async()=>auth,Auth:auth,addEventListener(){},
    __ACCOUNT_PAGE_URL:()=>"/conta/assinatura.html?lang="+language,
    __ACCOUNT_LOGIN_URL:u=>"/conta/login.html?returnUrl="+encodeURIComponent(u)};
  const document={documentElement:{setAttribute(){}},querySelector:()=>null,addEventListener:(name,fn)=>{handlers[name]=fn;}};
  vm.runInNewContext(fs.readFileSync("js/access/premium-print-guard.js","utf8"),{window,document,URL,setTimeout,console});
  return {window,redirects,prints:()=>prints,click(c){
    const event={target:c,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
    handlers.click(event);return event;
  }};
}
async function run(){
  for(const language of ["en","es","pt"]){
    const h=harness(false,language);
    const description=language==="en"?"Access blank scales to print and use during your shift!":"Escalas en blanco para imprimir y usar durante tu turno!";
    const card=control("A",description,{href:"formularios_de_escalas_assistenciais.html"});
    assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(card),null,language+": descrição não é ação");
    assert.equal(h.click(card).prevented,undefined,language+": primeiro clique deve navegar");
    assert.equal(h.click(card).prevented,undefined,language+": cliques seguintes devem navegar");
    const explicit=control("A","Print",{href:"form.html", "data-action":"print"});
    assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(explicit),explicit);
    const blocked=control("A",description,{href:"form.html","data-premium-print":"block"});
    assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(blocked),blocked);
    const pdf=control("A","Print form",{href:"form.pdf",download:""});
    assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(pdf),pdf);
    for(const href of ["", "#print"]) {
      const actionAnchor=control("A","Print",{href});
      assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(actionAnchor),actionAnchor,"Âncora de ação continua protegida");
    }
    const fake=control("A","Print",{href:"formXhtml"});
    assert.equal(h.window.__PREMIUM_PRINT_GUARD.isPrintControl(fake),fake,"Exigir extensão .html real");
    const printer=control("BUTTON","Print",{"data-action":"print"});
    assert.equal(h.click(printer).prevented,true);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.redirects.length,1,"Free continua bloqueado na impressão");
    assert.equal(h.prints(),0);
    assert.equal(printer.replayed,undefined);
    const subscriber=harness(true,language);
    const allowedPrinter=control("BUTTON","Imprimir",{"data-action":"print"});
    assert.equal(subscriber.click(allowedPrinter).prevented,true);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(allowedPrinter.replayed,1,"Premium executa ação uma vez");
    assert.equal(subscriber.redirects.length,0);
    subscriber.window.print();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(subscriber.prints(),1,"window.print continua autorizado somente com Premium");
  }
  console.log("PASS: navegação EN/ES/PT no primeiro clique; impressão Free bloqueada e Premium permitida.");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
