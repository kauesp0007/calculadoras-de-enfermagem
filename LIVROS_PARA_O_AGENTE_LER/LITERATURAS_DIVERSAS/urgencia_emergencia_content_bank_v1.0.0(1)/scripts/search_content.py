#!/usr/bin/env python3
import sqlite3,sys
DB=sys.argv[1] if len(sys.argv)>1 else "content_bank.sqlite"
q=" ".join(sys.argv[2:]) if len(sys.argv)>2 else ""
con=sqlite3.connect(DB)
for row in con.execute("SELECT source_id,locator,text FROM blocks_fts WHERE blocks_fts MATCH ? LIMIT 50",(q,)):
 print(f"[{row[0]} | {row[1]}] {row[2]}\n")
