/* Álbum compartilhado: acervo legado preservado; autoria via Firebase e album-author. */
(() => {
  'use strict';
  const URL_BASE = 'https://asjkftjfbkuuhilnqonx.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamtmdGpmYmt1dWhpbG5xb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODMxNjQsImV4cCI6MjA4MjY1OTE2NH0.mly76L5r2zoasonwta8aNND2mWWrkAoXirAAs99mDYo';
  const PAGE_SIZE = 12;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tri = (pt, en, es) => escape(pt) + '<small><span lang="en">' + escape(en) + '</span><span lang="es">' + escape(es) + '</span></small>';
  let client, user = null, photos = [], comments = {}, likes = {}, myLikes = {}, ownIds = new Set();
  let total = 0;
  let loading = false, hasMore = true, selectedFile = null, previewURL = null, editing = null, deleting = null, selectedRange = null;
  let authorKey;
  try { authorKey = localStorage.getItem('album_author_key'); } catch (_) {}
  if (!authorKey) { authorKey = crypto.randomUUID(); try { localStorage.setItem('album_author_key', authorKey); } catch (_) {} }

  function safeURL(value) {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch (_) { return ''; }
  }
  function sanitize(value) {
    const input = document.createElement('template');
    input.innerHTML = String(value || '').replace(/\\n/g, '\n');
    const allowed = new Set(['P','DIV','BR','B','STRONG','I','EM','U','SPAN','FONT','H3','UL','OL','LI']);
    function clean(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','IMG'].includes(node.tagName)) return document.createDocumentFragment();
      const result = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : document.createDocumentFragment();
      if (result.nodeType === Node.ELEMENT_NODE) {
        const color = node.style.color || node.getAttribute('color');
        if (color && /^(#[a-f0-9]{3,8}|rgb[a]?\([\d.,%\s]+\)|[a-z]{3,20})$/i.test(color)) result.style.color = color;
      }
      node.childNodes.forEach(child => result.appendChild(clean(child)));
      return result;
    }
    const output = document.createElement('div');
    input.content.childNodes.forEach(node => output.appendChild(clean(node)));
    return output.innerHTML;
  }
  function date(value) {
    if (!value) return '';
    // Legados timestamp without time zone eram gravados pelo banco em UTC.
    const iso = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + 'Z';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'});
  }
  function toast(pt, en, es) {
    document.querySelector('.album-toast')?.remove();
    const el = document.createElement('div'); el.className = 'album-toast'; el.setAttribute('role','status');
    el.innerHTML = tri(pt,en,es); document.body.append(el); setTimeout(() => el.remove(),6000);
  }
  async function api(action, values = {}, file = null) {
    const current = window.Auth?.currentUser();
    if (!current) throw new Error('login_required');
    const token = await current.getIdToken(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),30000);
    let body, headers = {Authorization:'Bearer ' + token,apikey:ANON_KEY};
    if (file) {
      body = new FormData(); body.append('action',action); body.append('payload',JSON.stringify(values)); body.append('file',file);
    } else { body = JSON.stringify({action,...values}); headers['Content-Type'] = 'application/json'; }
    try {
      const response = await fetch(URL_BASE + '/functions/v1/album-author',{method:'POST',headers,body,signal:controller.signal});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'request_failed');
      return result;
    } finally { clearTimeout(timer); }
  }
  function requireLogin() {
    if (window.Auth?.currentUser()) return true;
    $('uploadStatus').innerHTML = tri('Entre na sua conta para publicar.','Sign in to post.','Inicia sesión para publicar.') +
      '<a href="/conta/login.html?returnUrl=%2Falbum_enfermagem.html">' + tri('Entrar','Sign in','Iniciar sesión') + '</a>';
    return false;
  }
  async function loadIdentity() {
    try {
      await window.Auth.init(); user = window.Auth.currentUser();
      window.Auth.onAuthChange(next => { user = next; refreshOwners(); });
      await refreshOwners();
    } catch (_) {
      $('composerIdentity').innerHTML = tri('Entre na sua conta para publicar.','Sign in to post.','Inicia sesión para publicar.');
    }
  }
  async function refreshOwners() {
    ownIds = new Set();
    $('composerIdentity').innerHTML = user ? tri('Publicando como ' + (user.displayName || 'Usuário da comunidade'),'Posting as ' + (user.displayName || 'Community member'),'Publicando como ' + (user.displayName || 'Miembro de la comunidad')) : tri('Entre na sua conta para publicar.','Sign in to post.','Inicia sesión para publicar.');
    const expectedUID = user?.uid;
    if (user) { try { const result = await api('mine'); if (window.Auth.currentUser()?.uid === expectedUID) { ownIds = new Set(result.ids.map(String));
      const name = result.displayName || user.displayName || 'Usuário da comunidade';
      $('composerIdentity').innerHTML = tri('Publicando como ' + name,'Posting as ' + name,'Publicando como ' + name); } } catch (_) {} }
    document.querySelectorAll('[data-owner-tools]').forEach(el => el.hidden = !ownIds.has(el.dataset.ownerTools));
  }
  function setDrawer(open) {
    $('albumComposer').hidden = !open; $('albumStage').classList.toggle('composer-open',open);
    $('openComposer').setAttribute('aria-expanded',String(open));
    if (open) { positionDrawer(); $('closeComposer').focus(); } else $('openComposer').focus();
  }
  function positionDrawer() {
    const header = $('global-header-container');
    const rect = header?.getBoundingClientRect();
    const fixedHeaderBottom = [...(header?.querySelectorAll(':scope > *, nav, header') || [])].reduce((bottom,el) => {
      const style = getComputedStyle(el), box = el.getBoundingClientRect();
      return ['fixed','sticky'].includes(style.position) && box.width > innerWidth / 2 && box.top < 100 ? Math.max(bottom,box.bottom) : bottom;
    },0);
    const top = Math.max(8,Math.min(Math.max(rect?.bottom || 0,fixedHeaderBottom),innerHeight * .4) + 8);
    const footerTop = $('footer-placeholder')?.getBoundingClientRect().top ?? innerHeight;
    const height = Math.min(innerHeight - top - 12,footerTop - top - 12);
    const panel = $('albumComposer');
    panel.style.setProperty('--composer-top',top + 'px');
    panel.style.setProperty('--composer-height',Math.max(0,height) + 'px');
  }
  function clearFile() {
    selectedFile = null; $('fileInput').value = ''; $('previewContainer').hidden = true;
    if (previewURL) URL.revokeObjectURL(previewURL); previewURL = null;
  }
  function selectFile(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      toast('Use JPG, PNG ou WebP de até 5 MB.','Use JPG, PNG or WebP up to 5 MB.','Usa JPG, PNG o WebP de hasta 5 MB.'); return;
    }
    clearFile(); selectedFile = file; previewURL = URL.createObjectURL(file);
    $('imagePreview').src = previewURL; $('previewContainer').hidden = false;
  }
  function resetComposer() {
    $('uploadForm').reset(); $('descricao-editor').innerHTML = ''; $('uploadStatus').innerHTML = ''; clearFile(); editing = null;
    $('btnPublicar').innerHTML = tri('Postar no álbum','Post to album','Publicar en el álbum');
    $('composerTitle').innerHTML = tri('Compartilhar foto','Share a photo','Compartir foto');
  }
  async function submit(event) {
    event.preventDefault();
    if (!requireLogin()) return;
    const data = {
      titulo:$('titulo').value.trim(),ano:Number($('ano').value),localizacao:$('localizacao').value.trim(),
      instituicao:$('instituicao').value.trim(),descricao:sanitize($('descricao-editor').innerHTML),
      anonymous:$('anonymous').checked,consent:$('consentimento').checked
    };
    if ((!editing && !selectedFile) || !$('descricao-editor').textContent.trim() || !data.consent) {
      $('uploadStatus').innerHTML = tri('Preencha a foto e a descrição e concorde com as políticas.','Add a photo and description and agree to the policies.','Añade una foto y descripción y acepta las políticas.'); return;
    }
    const button = $('btnPublicar'); button.disabled = true;
    $('uploadStatus').innerHTML = tri('Publicando…','Posting…','Publicando…');
    try {
      const result = await api(editing ? 'update' : 'create',{...data,...(editing ? {photo_id:editing.id} : {})},selectedFile);
      const photo = result.photo; ownIds.add(String(photo.id));
      const index = photos.findIndex(p => p.id === photo.id);
      if (index >= 0) photos[index] = photo; else { photos.unshift(photo); total++; }
      updateCount();
      render(); resetComposer(); setDrawer(false);
      toast('Publicação salva.','Post saved.','Publicación guardada.');
    } catch (error) {
      $('uploadStatus').innerHTML = tri('Não foi possível publicar. Seu rascunho foi mantido; tente novamente.','Could not post. Your draft was kept; try again.','No se pudo publicar. Se conservó el borrador; inténtalo de nuevo.');
      console.warn('[Álbum] publicação:',error.message);
    } finally { button.disabled = false; }
  }
  async function loadInteractions() {
    const [likeResult,commentResult] = await Promise.all([
      client.from('album_likes').select('id,foto_id,author_key'),
      client.from('album_comentarios').select('id,foto_id,author_name,comentario,localizacao,created_at').order('created_at',{ascending:true})
    ]);
    if (likeResult.error || commentResult.error) toast('Algumas interações não puderam ser carregadas.','Some interactions could not be loaded.','No se pudieron cargar algunas interacciones.');
    if (!likeResult.error) {
      likes = {}; myLikes = {};
      (likeResult.data || []).forEach(l => { (likes[l.foto_id] ||= []).push(l); if (l.author_key === authorKey) myLikes[l.foto_id] = l.id; });
    }
    if (!commentResult.error) {
      comments = {}; (commentResult.data || []).forEach(c => (comments[c.foto_id] ||= []).push(c));
    }
  }
  async function loadPhotos() {
    if (loading || !hasMore) return;
    loading = true; $('albumGrid').setAttribute('aria-busy','true'); $('btnCarregarMais').disabled = true;
    try {
      const {data,error,count} = await client.from('album_fotos')
        .select('id,titulo,descricao,ano,instituicao,localizacao,imagem_url,data_upload,author_name,author_avatar,anonymous',{count:'exact'})
        .order('data_upload',{ascending:false}).order('id',{ascending:false}).range(photos.length,photos.length + PAGE_SIZE - 1);
      if (error) throw error;
      data.forEach(photo => { if (!photos.some(p => p.id === photo.id)) photos.push(photo); });
      hasMore = data.length === PAGE_SIZE && photos.length < count;
      $('loadMoreContainer').hidden = !hasMore;
      total = count; updateCount();
      render();
    } catch (_) {
      if (!photos.length) $('albumGrid').innerHTML = '<p class="album-state">' + tri('Não foi possível carregar o álbum.','Could not load the album.','No se pudo cargar el álbum.') + '<button id="retryAlbum" class="album-button">' + tri('Tentar novamente','Retry','Reintentar') + '</button></p>';
      else toast('Não foi possível carregar mais fotos.','Could not load more photos.','No se pudieron cargar más fotos.');
    } finally { loading = false; $('albumGrid').setAttribute('aria-busy','false'); $('btnCarregarMais').disabled = false; }
  }
  function commentHTML(c) {
    return '<div class="postit">' + escape(c.comentario) + '<span class="postit-meta">' + escape(c.author_name || '') +
      (c.author_name ? ' · ' : '') + escape(date(c.created_at)) + (c.localizacao ? ' · ' + escape(c.localizacao) : '') + '</span></div>';
  }
  function commentsHTML(id) {
    const list = comments[id] || [];
    return (list.length ? commentHTML(list[0]) : '') + (list.length > 1 ? '<details class="comments-details"><summary>' + tri('Mais comentários (' + (list.length - 1) + ')','More comments (' + (list.length - 1) + ')','Más comentarios (' + (list.length - 1) + ')') + '</summary>' + list.slice(1).map(commentHTML).join('') + '</details>' : '') +
      '<details class="postit-form"><summary>' + tri('Comentar','Comment','Comentar') + '</summary><label for="comment-' + id + '">' + tri('Seu comentário','Your comment','Tu comentario') + '</label><textarea id="comment-' + id + '" data-comment="' + id + '" rows="1" maxlength="1500"></textarea><button class="album-button" data-save="' + id + '">' + tri('Enviar','Send','Enviar') + '</button></details>';
  }
  function cardHTML(photo) {
    const id = String(photo.id), liked = !!myLikes[id], html = sanitize(photo.descricao);
    const identity = photo.anonymous ? tri('Anônimo','Anonymous','Anónimo') : photo.author_name ? escape(photo.author_name) : tri('Acervo da comunidade','Community collection','Acervo de la comunidad');
    const avatar = !photo.anonymous && safeURL(photo.author_avatar);
    return '<article class="photo-item" data-photo="' + id + '"><div class="photo-frame"><button class="photo-open" data-view="' + id + '" aria-label="Ampliar foto / Enlarge photo / Ampliar foto"><img src="' + escape(safeURL(photo.imagem_url)) + '" alt="' + escape(photo.titulo) + '" width="640" height="480" loading="lazy" decoding="async"></button></div>' +
      '<div class="photo-caption"><h3>' + escape(photo.titulo) + '</h3><div class="photo-meta">' +
      (photo.ano ? '<span>' + tri('Ano','Year','Año') + ' ' + escape(photo.ano) + '</span>' : '') +
      (photo.localizacao ? '<span>' + tri('Localização','Location','Ubicación') + ' ' + escape(photo.localizacao) + '</span>' : '') +
      (photo.instituicao ? '<span>' + tri('Instituição','Institution','Institución') + ' ' + escape(photo.instituicao) + '</span>' : '') + '</div>' +
      '<div class="photo-author">' + (avatar ? '<img src="' + escape(avatar) + '" alt="" width="22" height="22" loading="lazy">' : '') + '<span>' + identity + '</span><time>' + escape(date(photo.data_upload)) + '</time></div>' +
      '<div class="photo-description photo-description-preview">' + html + '</div><details class="photo-description-full" hidden><summary>' + tri('Recolher descrição','Collapse description','Contraer descripción') + '</summary><div class="photo-description">' + html + '</div></details><button class="description-toggle" data-description="' + id + '">' + tri('Ler história completa','Read full story','Leer historia completa') + '</button>' +
      '<div class="photo-tools"><span data-owner-tools="' + id + '"' + (ownIds.has(id) ? '' : ' hidden') + '><button data-edit="' + id + '">' + tri('Editar','Edit','Editar') + '</button><button data-delete="' + id + '">' + tri('Excluir','Delete','Eliminar') + '</button></span>' +
      '<button class="like-btn' + (liked ? ' liked' : '') + '" data-like="' + id + '" aria-pressed="' + liked + '" aria-label="Curtir / Like / Me gusta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S2 14 2 7a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 14-10 14Z"/></svg><span>' + tri('Curtir','Like','Me gusta') + '</span><span class="like-count">' + (likes[id]?.length || 0) + '</span></button></div><div class="postits" data-postits="' + id + '">' + commentsHTML(id) + '</div></div></article>';
  }
  function updateCount() { $('albumCount').innerHTML = tri(total + ' fotos no acervo',total + ' photos in the collection',total + ' fotos en el acervo'); }
  function render() {
    $('albumGrid').innerHTML = photos.length ? photos.map(cardHTML).join('') : '<p class="album-state">' + tri('O mural espera sua primeira foto.','The wall awaits your first photo.','El mural espera tu primera foto.') + '</p>';
    $('albumGrid').querySelectorAll('img').forEach(img => img.addEventListener('error',() => { img.alt = 'Imagem indisponível / Image unavailable / Imagen no disponible'; }));
  }
  async function like(id,button) {
    if (button.disabled) return; button.disabled = true;
    try {
      const result = myLikes[id] ? await client.from('album_likes').delete().eq('id',myLikes[id]) :
        await client.from('album_likes').insert({foto_id:Number(id),author_key:authorKey});
      if (result.error) throw result.error;
      await loadInteractions();
      button.classList.toggle('liked',!!myLikes[id]); button.setAttribute('aria-pressed',String(!!myLikes[id])); button.querySelector('.like-count').textContent = likes[id]?.length || 0;
    } catch (_) { toast('Não foi possível alterar a curtida.','Could not update the like.','No se pudo actualizar el me gusta.'); }
    finally { button.disabled = false; }
  }
  async function saveComment(id,button) {
    const input = document.querySelector('[data-comment="' + id + '"]'); const text = input.value.trim();
    if (!text) return; button.disabled = true;
    try {
      const {error} = await client.from('album_comentarios').insert({foto_id:Number(id),author_key:authorKey,comentario:text});
      if (error) throw error;
      await loadInteractions(); document.querySelector('[data-postits="' + id + '"]').innerHTML = commentsHTML(id);
      toast('Comentário salvo.','Comment saved.','Comentario guardado.');
    } catch (_) { toast('Não foi possível comentar. Seu texto foi mantido.','Could not comment. Your text was kept.','No se pudo comentar. Se conservó el texto.'); }
    finally { button.disabled = false; }
  }
  function editPhoto(id) {
    if (!ownIds.has(id)) return; resetComposer(); editing = photos.find(p => String(p.id) === id);
    if (!editing) return;
    ['titulo','ano','localizacao','instituicao'].forEach(key => $(key).value = editing[key] || '');
    $('descricao-editor').innerHTML = sanitize(editing.descricao); $('anonymous').checked = !!editing.anonymous;
    $('imagePreview').src = safeURL(editing.imagem_url); $('previewContainer').hidden = false;
    $('btnPublicar').innerHTML = tri('Salvar alterações','Save changes','Guardar cambios');
    $('composerTitle').innerHTML = tri('Editar publicação','Edit post','Editar publicación'); setDrawer(true);
  }
  async function deletePhoto() {
    if (!deleting) return; const button = $('confirmDelete'); button.disabled = true;
    try {
      await api('delete',{photo_id:Number(deleting)}); photos = photos.filter(p => String(p.id) !== deleting); ownIds.delete(deleting); total--; updateCount();
      render(); $('deleteDialog').close(); toast('Publicação excluída.','Post deleted.','Publicación eliminada.');
    } catch (_) { $('deleteStatus').innerHTML = tri('Não foi possível excluir. Tente novamente.','Could not delete. Try again.','No se pudo eliminar. Inténtalo de nuevo.'); }
    finally { button.disabled = false; }
  }
  function setup() {
    $('openComposer').addEventListener('click',() => setDrawer($('albumComposer').hidden));
    $('closeComposer').addEventListener('click',() => setDrawer(false));
    $('fileInput').addEventListener('change',e => { if (e.target.files[0]) selectFile(e.target.files[0]); });
    $('removePreview').addEventListener('click',clearFile);
    $('uploadForm').addEventListener('submit',submit); $('btnCarregarMais').addEventListener('click',loadPhotos);
    const zone = $('dropzone');
    zone.addEventListener('dragover',e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave',() => zone.classList.remove('dragover'));
    zone.addEventListener('drop',e => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]); });
    $('albumGrid').addEventListener('click',e => {
      const btn = e.target.closest('button'); if (!btn) return;
      if (btn.id === 'retryAlbum') return loadPhotos();
      if (btn.dataset.like) return like(btn.dataset.like,btn);
      if (btn.dataset.save) return saveComment(btn.dataset.save,btn);
      if (btn.dataset.edit) return editPhoto(btn.dataset.edit);
      if (btn.dataset.delete && ownIds.has(btn.dataset.delete)) { deleting = btn.dataset.delete; $('deleteStatus').innerHTML = ''; return $('deleteDialog').showModal(); }
      if (btn.dataset.view) { const photo = photos.find(p => String(p.id) === btn.dataset.view); $('viewerImage').src = safeURL(photo.imagem_url); $('viewerImage').alt = photo.titulo; $('viewerCaption').textContent = photo.titulo; return $('photoViewer').showModal(); }
      if (btn.dataset.description) {
        const card = btn.closest('article'), details = card.querySelector('.photo-description-full');
        details.hidden = false; details.open = true; card.querySelector('.photo-description-preview').hidden = true; btn.hidden = true;
        details.addEventListener('toggle',() => { if (!details.open) { details.hidden = true; card.querySelector('.photo-description-preview').hidden = false; btn.hidden = false; } });
      }
    });
    // Leitura dos comentários em sanfona; ao sair da área, mantém apenas o principal.
    $('albumGrid').addEventListener('focusout',e => { const details = e.target.closest('.comments-details'); if (details && !details.contains(e.relatedTarget)) details.open = false; });
    $('albumGrid').addEventListener('mouseleave',e => { if (e.target.matches?.('.comments-details')) e.target.open = false; },true);
    $('closeViewer').addEventListener('click',() => $('photoViewer').close());
    $('cancelDelete').addEventListener('click',() => $('deleteDialog').close()); $('confirmDelete').addEventListener('click',deletePhoto);
    document.addEventListener('keydown',e => { if (e.key === 'Escape' && !$('albumComposer').hidden) setDrawer(false); });
    document.addEventListener('selectionchange',() => {
      const selection = getSelection(); if (selection.rangeCount && $('descricao-editor').contains(selection.anchorNode)) selectedRange = selection.getRangeAt(0).cloneRange();
    });
    document.querySelectorAll('[data-format]').forEach(button => {
      button.addEventListener('mousedown',e => e.preventDefault());
      button.addEventListener('click',() => applyFormat(button.dataset.format));
    });
    $('textColor').addEventListener('input',e => applyFormat('foreColor',e.target.value));
    $('descricao-editor').addEventListener('paste',e => { e.preventDefault(); document.execCommand('insertText',false,e.clipboardData.getData('text/plain')); });
    $('getGeolocation').addEventListener('click',() => {
      const el = $('geoStatus'); el.hidden = false; el.innerHTML = tri('Obtendo localização…','Getting location…','Obteniendo ubicación…');
      if (!navigator.geolocation) { el.innerHTML = tri('Localização indisponível. Preencha manualmente.','Location unavailable. Enter it manually.','Ubicación no disponible. Escríbela manualmente.'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        $('localizacao').value = pos.coords.latitude.toFixed(3) + ', ' + pos.coords.longitude.toFixed(3);
        el.innerHTML = tri('Coordenadas preenchidas; você pode substituir pela cidade.','Coordinates added; you may replace them with the city.','Coordenadas añadidas; puedes sustituirlas por la ciudad.');
      },() => { el.innerHTML = tri('Sem permissão de localização. Preencha manualmente.','Location permission denied. Enter it manually.','Permiso de ubicación denegado. Escríbela manualmente.'); },{timeout:10000});
    });
    let scheduled = false;
    const reposition = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(() => { positionDrawer(); scheduled = false; }); } };
    window.addEventListener('scroll',reposition,{passive:true}); window.addEventListener('resize',reposition);
    new ResizeObserver(reposition).observe($('global-header-container'));
  }
  function applyFormat(command,value = null) {
    $('descricao-editor').focus();
    if (selectedRange && $('descricao-editor').contains(selectedRange.commonAncestorContainer)) { const selection = getSelection(); selection.removeAllRanges(); selection.addRange(selectedRange); }
    document.execCommand(command,false,value);
  }
  async function boot() {
    setup(); loadIdentity();
    if (!window.supabase) { $('albumGrid').innerHTML = '<p class="album-state">' + tri('Não foi possível carregar o álbum. Atualize a página.','Could not load the album. Refresh the page.','No se pudo cargar el álbum. Actualiza la página.') + '</p>'; return; }
    client = window.supabase.createClient(URL_BASE,ANON_KEY,{global:{headers:{'x-author-key':authorKey}}});
    await loadInteractions(); await loadPhotos();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
