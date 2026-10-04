#!/usr/bin/env python3
import argparse,json,sys
from pathlib import Path

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--manifest',required=True);ap.add_argument('--corpus',required=True);args=ap.parse_args()
    srcs=json.load(open(args.manifest,encoding='utf-8')); base=Path(args.corpus)
    rows=[]; ok=True
    for s in srcs:
        p=base/s['source_id']/'meta'/'source.json'
        if not p.exists():
            rows.append({'source_id':s['source_id'],'status':'MISSING'});ok=False;continue
        m=json.load(open(p,encoding='utf-8'))
        status='PASS' if m.get('downloaded_pages',0)>0 and m.get('license_verified_on_landing') else 'FAIL'
        if status!='PASS': ok=False
        rows.append({'source_id':s['source_id'],'status':status,'downloaded_pages':m.get('downloaded_pages',0),'failed_pages':m.get('failed_pages',0),'license_verified':m.get('license_verified_on_landing')})
    print(json.dumps(rows,ensure_ascii=False,indent=2))
    sys.exit(0 if ok else 2)
if __name__=='__main__': main()
