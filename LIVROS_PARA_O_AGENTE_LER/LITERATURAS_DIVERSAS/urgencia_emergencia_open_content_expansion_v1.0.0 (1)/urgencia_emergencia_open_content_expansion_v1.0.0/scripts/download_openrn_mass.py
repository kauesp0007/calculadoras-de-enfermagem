#!/usr/bin/env python3
import argparse, csv, hashlib, json, re, time
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse
import requests
from bs4 import BeautifulSoup, NavigableString, Tag

UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36 OpenRN-Acquisition/1.0'
LICENSE_PATTERNS=('Creative Commons Attribution 4.0','CC BY 4.0','creativecommons.org/licenses/by/4.0')


def sha256(b): return hashlib.sha256(b).hexdigest()
def clean_url(u):
    p=urlparse(u)
    return urlunparse((p.scheme,p.netloc,p.path,'','',''))

def get(session,url,retries=4):
    last=None
    for i in range(retries):
        try:
            r=session.get(url,timeout=60,allow_redirects=True)
            if r.status_code==200: return r
            last=RuntimeError(f'HTTP {r.status_code}: {url}')
        except Exception as e: last=e
        time.sleep(min(8,1.5*(i+1)))
    raise last

def main_node(soup):
    for sel in ['main','#maincontent','.body-content','#content','.content']:
        n=soup.select_one(sel)
        if n: return n
    return soup.body or soup

def blockify(root):
    blocks=[]; order=0
    wanted={'h1','h2','h3','h4','h5','h6','p','li','dt','dd','caption','th','td','pre','blockquote'}
    for el in root.find_all(list(wanted)):
        # skip text nested in a wanted parent to reduce duplicates
        if el.find_parent(list(wanted)) is not None: continue
        txt=' '.join(el.stripped_strings)
        txt=re.sub(r'\s+',' ',txt).strip()
        if not txt: continue
        order+=1
        blocks.append({'order':order,'tag':el.name,'text':txt})
    return blocks

def md_from_blocks(blocks):
    out=[]
    for b in blocks:
        t=b['text']; tag=b['tag']
        if tag and tag.startswith('h') and len(tag)==2 and tag[1].isdigit():
            out.append('#'*min(int(tag[1]),6)+' '+t)
        elif tag=='li': out.append('- '+t)
        elif tag=='blockquote': out.append('> '+t)
        elif tag=='pre': out.append('```\n'+t+'\n```')
        else: out.append(t)
    return '\n\n'.join(out)+'\n'

def extract_links(toc_url,html,root_id):
    soup=BeautifulSoup(html,'lxml')
    links=[]
    for a in soup.find_all('a',href=True):
        href=urljoin(toc_url,a['href'])
        p=urlparse(href)
        if p.netloc not in ('www.ncbi.nlm.nih.gov','ncbi.nlm.nih.gov'): continue
        m=re.search(r'/books/(?:n/[^/]+/)?(NBK\d+)/?',p.path)
        if not m: continue
        u=clean_url(href)
        if u not in links: links.append(u)
    # root page itself is metadata, not a chapter; keep other NBKs found in TOC
    return [u for u in links if root_id not in u or '/toc' not in u]

def download_assets(session,html_url,soup,dest,asset_rows):
    dest.mkdir(parents=True,exist_ok=True)
    seen=set()
    for img in soup.find_all('img',src=True):
        u=urljoin(html_url,img['src'])
        if u in seen: continue
        seen.add(u)
        if urlparse(u).netloc not in ('www.ncbi.nlm.nih.gov','ncbi.nlm.nih.gov'): continue
        try:
            r=get(session,u,2)
            ct=r.headers.get('content-type','')
            if not ct.startswith('image/'): continue
            ext={"image/jpeg":".jpg","image/png":".png","image/gif":".gif","image/webp":".webp"}.get(ct.split(';')[0],Path(urlparse(u).path).suffix or '.bin')
            fn=sha256(r.content)[:20]+ext
            (dest/fn).write_bytes(r.content)
            cap=''
            fig=img.find_parent('figure')
            if fig:
                c=fig.find('figcaption')
                if c: cap=' '.join(c.stripped_strings)
            asset_rows.append({'url':u,'file':fn,'sha256':sha256(r.content),'caption':cap,'rights_status':'ASSET_REVIEW_REQUIRED'})
        except Exception as e:
            asset_rows.append({'url':u,'file':'','sha256':'','caption':'','rights_status':'DOWNLOAD_FAILED','error':str(e)})

def process_source(session,src,out,assets,delay):
    sid=src['source_id']; root=out/sid
    for d in ['html','md','jsonl','meta']: (root/d).mkdir(parents=True,exist_ok=True)
    landing=src['landing_url'].rstrip('/')+'/'
    toc=landing+'toc/?report=reader'
    r0=get(session,landing+'?report=reader')
    landing_text=BeautifulSoup(r0.text,'lxml').get_text(' ',strip=True)
    license_ok=any(p.lower() in landing_text.lower() for p in LICENSE_PATTERNS)
    rt=get(session,toc)
    urls=extract_links(toc,rt.text,src['bookshelf_id'])
    # Add root report reader for title metadata; chapters discovered from TOC.
    if not urls:
        urls=[landing]
    index=[]; asset_rows=[]; hashes={}
    for i,u in enumerate(urls,1):
        pr=u+('?report=printable' if '?' not in u else '&report=printable')
        try:
            r=get(session,pr)
            soup=BeautifulSoup(r.text,'lxml')
            rootnode=main_node(soup)
            blocks=blockify(rootnode)
            if not blocks: continue
            text='\n'.join(x['text'] for x in blocks)
            h=hashlib.sha256(text.encode('utf-8')).hexdigest()
            if h in hashes:
                index.append({'url':pr,'status':'DUPLICATE','duplicate_of':hashes[h],'sha256_text':h,'blocks':len(blocks)})
                continue
            hashes[h]=pr
            slug=f'{i:04d}_{re.sub(r"[^A-Za-z0-9._-]+","_",urlparse(u).path.strip("/").split("/")[-1])[:70] or "page"}'
            (root/'html'/f'{slug}.html').write_text(r.text,encoding='utf-8')
            (root/'md'/f'{slug}.md').write_text(md_from_blocks(blocks),encoding='utf-8')
            with open(root/'jsonl'/f'{slug}.jsonl','w',encoding='utf-8') as f:
                for b in blocks:
                    rec={**b,'source_id':sid,'source_url':pr,'sha256_text':hashlib.sha256(b['text'].encode('utf-8')).hexdigest()}
                    f.write(json.dumps(rec,ensure_ascii=False)+'\n')
            if assets: download_assets(session,pr,soup,root/'assets_pending_review',asset_rows)
            index.append({'url':pr,'status':'OK','sha256_text':h,'blocks':len(blocks),'chars':len(text),'slug':slug})
        except Exception as e:
            index.append({'url':pr,'status':'FAILED','error':str(e)})
        time.sleep(delay)
    meta={**src,'license_verified_on_landing':license_ok,'downloaded_pages':sum(1 for x in index if x['status']=='OK'),'failed_pages':sum(1 for x in index if x['status']=='FAILED'),'duplicate_pages':sum(1 for x in index if x['status']=='DUPLICATE'),'index':index}
    (root/'meta'/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
    if asset_rows:
        with open(root/'meta'/'assets.csv','w',encoding='utf-8-sig',newline='') as f:
            fields=sorted(set().union(*(r.keys() for r in asset_rows)))
            w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(asset_rows)
    return meta

def cli():
    ap=argparse.ArgumentParser(description='Download and preserve the latest Open RN corpus from NCBI Bookshelf.')
    ap.add_argument('--manifest',required=True)
    ap.add_argument('--out',default='openrn_corpus')
    ap.add_argument('--priority',choices=['P0','P1','P2','ALL'],default='ALL')
    ap.add_argument('--assets',action='store_true',help='Download NCBI-hosted images into assets_pending_review; all require asset-level rights review.')
    ap.add_argument('--delay',type=float,default=0.35)
    args=ap.parse_args()
    sources=json.load(open(args.manifest,encoding='utf-8'))
    if args.priority!='ALL': sources=[s for s in sources if s['priority']==args.priority]
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    sess=requests.Session();sess.headers.update({'User-Agent':UA,'Accept-Language':'en-US,en;q=0.9'})
    report=[]
    for n,s in enumerate(sources,1):
        print(f'[{n}/{len(sources)}] {s["source_id"]}: {s["title"]}',flush=True)
        try:
            m=process_source(sess,s,out,args.assets,args.delay)
            report.append({'source_id':s['source_id'],'status':'OK','pages':m['downloaded_pages'],'failed':m['failed_pages'],'license_verified':m['license_verified_on_landing']})
        except Exception as e:
            report.append({'source_id':s['source_id'],'status':'FAILED','error':str(e)})
    (out/'_acquisition_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__': cli()
