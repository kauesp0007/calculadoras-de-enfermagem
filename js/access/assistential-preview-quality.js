(function(document){
  'use strict';
  var images=Array.from(document.querySelectorAll('img[src*="/img/formularios-previas/"]'));
  if(!images.length)return;
  fetch('/scripts/assistential-preview-quality.json?v='+Date.now(),{cache:'no-store'})
    .then(function(response){if(!response.ok)throw new Error('Preview manifest unavailable');return response.json();})
    .then(function(rows){
      if(!Array.isArray(rows))return;
      var entries=new Map(rows.filter(function(r){return /^img\/formularios-previas\/(?:(?:en|es)\/)?form-\d{3}\.webp$/.test(r.preview)&&/^[a-f0-9]{64}$/.test(r.webp_sha256)&&r.dpi===200&&r.lossless&&Number.isInteger(r.width)&&Number.isInteger(r.height)&&r.width>1000&&r.height>1000;}).map(function(r){return ['/'+r.preview,r];}));
      images.forEach(function(img){var path=new URL(img.src,location.origin).pathname,r=entries.get(path);if(!r)return;img.width=r.width;img.height=r.height;img.src=path+'?v='+r.webp_sha256.slice(0,16);});
    }).catch(function(){/* Existing versioned image remains visible. No entitlement is changed. */});
})(document);
