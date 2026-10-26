'use strict';
const fs=require('node:fs'),path=require('node:path');
const website='https://www.calculadorasdeenfermagem.com.br/';
const email='ciadeenfermagem@gmail.com.br';
const mailto='mailto:'+email;
const logo='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../../assets/brand/logo-report.png')).toString('base64');
const printCSS='.document-brand{display:flex;align-items:center;gap:7px;break-inside:avoid;font:7pt/1.45 Arial,sans-serif;margin-top:7px;overflow-wrap:anywhere}.document-brand img{width:38px;height:28px;object-fit:contain;flex-shrink:0}.document-brand strong{display:block}.document-brand a{color:inherit;text-decoration:none}';
const printFooter=`<div class="document-brand"><img src="${logo}" width="38" height="28" alt="Marca Calculadoras de Enfermagem"><div><strong>Estação de Enfermagem · Calculadoras de Enfermagem</strong><a href="${website}">${website}</a><br><a href="${mailto}">${email}</a></div></div>`;
module.exports={website,email,mailto,printCSS,printFooter};
