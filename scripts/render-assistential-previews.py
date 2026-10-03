#!/usr/bin/env python3
"""Render original first-page PDF previews, 200 DPI, lossless WebP. No AI inference."""
import argparse, hashlib, json, os, re, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops, features
ROOT=Path(__file__).resolve().parents[1]
VERSION=1

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def generate(entry, previous):
    language=entry['language']; ident=entry['id']
    if language not in ('pt','en','es') or not re.fullmatch(r'form-\d{3}',ident): raise ValueError('Invalid preview identity')
    relative=Path(entry['pdf'].lstrip('/')); source=(ROOT/relative).resolve()
    if not source.is_relative_to(ROOT/'FORMULARIOS_DE_ESCALAS'): raise ValueError('Invalid source path')
    if not source.read_bytes().startswith(b'%PDF-'): raise ValueError('Invalid PDF: '+str(relative))
    folder=ROOT/'img/formularios-previas'/('' if language=='pt' else language); folder.mkdir(parents=True,exist_ok=True)
    target=folder/(ident+'.webp'); key=str(target.relative_to(ROOT)).replace(os.sep,'/')
    source_sha=digest(source); cached=previous.get(key,{})
    if cached.get('source_sha256')==source_sha and cached.get('version')==VERSION and target.exists() and digest(target)==cached.get('webp_sha256'):
        with Image.open(target) as im:
            if list(im.size)==[cached['width'],cached['height']] and b'VP8L' in target.read_bytes(): return cached
    info=subprocess.check_output(['pdfinfo',str(source)],text=True)
    pages=int(re.search(r'^Pages:\s+(\d+)',info,re.M).group(1))
    with tempfile.TemporaryDirectory(prefix='assistential-preview-') as work:
        prefix=str(Path(work)/'page')
        subprocess.run(['pdftoppm','-r','200','-f','1','-l','1','-singlefile','-png',str(source),prefix],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        with Image.open(prefix+'.png') as rendered:
            image=rendered.convert('RGB')
        temp=target.with_suffix('.webp.tmp');image.save(temp,'WEBP',lossless=True,method=6)
        with Image.open(temp) as restored:
            if ImageChops.difference(image,restored.convert('RGB')).getbbox() is not None: raise ValueError('Lossless pixel mismatch')
        if min(image.size)<1000: raise ValueError('Unexpectedly low raster resolution')
        temp.replace(target)
        return dict(version=VERSION,language=language,id=ident,pdf=str(relative).replace(os.sep,'/'),preview=key,dpi=200,lossless=True,width=image.width,height=image.height,pdf_pages=pages,preview_page=1,source_sha256=source_sha,webp_sha256=digest(target),bytes=target.stat().st_size)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--workers',type=int,default=4);parser.add_argument('--audit',action='store_true');args=parser.parse_args()
    entries=json.loads((ROOT/'scripts/assistential-preview-map.json').read_text())
    counts={lang:sum(e['language']==lang for e in entries) for lang in ['pt','en','es']}
    if counts!={'pt':66,'en':63,'es':63}:raise ValueError('Unexpected catalog size: '+str(counts))
    keys=[(e['language'],e['id']) for e in entries]
    if len(set(keys))!=len(keys):raise ValueError('Duplicate preview IDs')
    if not features.check('webp'):raise RuntimeError('Pillow requires WebP support')
    manifest=ROOT/'scripts/assistential-preview-quality.json'
    old=json.loads(manifest.read_text()) if manifest.exists() else []
    if args.audit:
        bykey={(e['language'],e['id']):e for e in old}
        if len(bykey)!=len(entries):raise ValueError('Incomplete quality manifest')
        for e in entries:
            item=bykey[(e['language'],e['id'])];path=ROOT/item['preview']
            if item['dpi']!=200 or not item['lossless'] or digest(ROOT/e['pdf'].lstrip('/'))!=item['source_sha256'] or digest(path)!=item['webp_sha256']:raise ValueError('Quality/source verification failed')
            with Image.open(path) as im:
                if list(im.size)!=[item['width'],item['height']] or min(im.size)<1000 or b'VP8L' not in path.read_bytes():raise ValueError('Invalid lossless raster')
        print('PASS quality audit:',counts);return
    previous={x['preview']:x for x in old}
    with ThreadPoolExecutor(max_workers=max(1,min(args.workers,8))) as pool: results=list(pool.map(lambda e:generate(e,previous),entries))
    manifest.write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
    print('PASS 200 DPI lossless previews:',counts,'total bytes',sum(x['bytes'] for x in results),'multipage originals',sum(x['pdf_pages']>1 for x in results))
if __name__=='__main__':main()
