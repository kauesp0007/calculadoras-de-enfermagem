#!/usr/bin/env python3
from pathlib import Path
import requests
URL="https://www.ncbi.nlm.nih.gov/books/NBK596732/?report=reader"
OUT=Path(__file__).resolve().parent.parent/"incoming_open_sources"/"SRC-NCBI"
OUT.mkdir(parents=True,exist_ok=True)
r=requests.get(URL,timeout=90,headers={"User-Agent":"Mozilla/5.0 content-acquisition/1.0"})
r.raise_for_status()
(OUT/"source.html").write_bytes(r.content)
print("saved",OUT/"source.html",len(r.content),r.headers.get("content-type"))
print("license: CC BY 4.0; verify item-level third-party credits before reusing individual figures")
