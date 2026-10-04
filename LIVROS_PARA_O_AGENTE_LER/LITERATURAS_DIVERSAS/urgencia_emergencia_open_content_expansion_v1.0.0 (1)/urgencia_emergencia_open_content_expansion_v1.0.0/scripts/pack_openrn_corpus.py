#!/usr/bin/env python3
import argparse,shutil
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--corpus',required=True);ap.add_argument('--out',default='openrn_corpus_downloaded');a=ap.parse_args()
base=Path(a.corpus); shutil.make_archive(a.out,'zip',root_dir=base); print(str(Path(a.out+'.zip').resolve()))
