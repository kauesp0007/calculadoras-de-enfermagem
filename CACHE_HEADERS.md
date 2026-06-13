Configuração de `Cache-Control` para HTML (exemplos)

Objetivo: garantir que navegadores verifiquem sempre a versão atual do Service Worker e do HTML.

Apache (.htaccess)

<IfModule mod_headers.c>
  <FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>

Nginx (exemplo de bloco server/location)

location ~\* \.(?:html|htm)$ {
add_header Cache-Control "no-cache, no-store, must-revalidate";
add_header Pragma "no-cache";
add_header Expires "0";
}

Netlify (`_headers`)

/_
/index.html
Cache-Control: no-cache, no-store, must-revalidate
/_.html
Cache-Control: no-cache, no-store, must-revalidate

Observação: coloque um arquivo chamado `_headers` na raiz do deploy.

Vercel (`vercel.json`)

{
"headers": [
{
"source": "/(.\*\\.html)",
"headers": [
{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
]
}
]
}

Express (Node)

app.use((req, res, next) => {
if (req.path.endsWith('.html') || req.accepts('html')) {
res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
res.set('Pragma', 'no-cache');
res.set('Expires', '0');
}
next();
});

Observações e recomendações

- `no-cache` não impede o armazenamento; instrui o navegador a validar antes de usar.
- Combine com o SW: o SW controla como os recursos são servidos para páginas já controladas.
- Em hosts como GitHub Pages não há suporte direto a cabeçalhos — use CDN/Cloudflare ou um pipeline de deploy que aplique cabeçalhos.
- Teste após deploy com DevTools (Network → Disable cache) e verifique `Response Headers`.
