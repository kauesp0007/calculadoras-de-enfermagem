"""Build reviewed, versioned local templates from the owner's supplied HTML sources.
Usage: python tools/extract-forms.py brazilian.html head-to-toe.html
No external scripts, event handlers, links or remote assets are carried over.
"""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import json,sys
VOID={'input','br','hr','img','meta','link','wbr'}
class Node:
 def __init__(self,tag='',attrs=None,parent=None):self.tag=tag;self.attrs=dict(attrs or []);self.children=[];self.parent=parent
 def all(self):
  yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.all()
 def text(self):return ' '.join(c.text() if isinstance(c,Node) else c for c in self.children).strip()
 def has(self,cls):return cls in self.attrs.get('class','').split()
 def html(self):
  attrs=''.join(' '+k+'="'+escape(str(v or ''),quote=True)+'"' for k,v in self.attrs.items())
  return '<'+self.tag+attrs+'>'+('' if self.tag in VOID else ''.join(c.html() if isinstance(c,Node) else escape(c) for c in self.children)+'</'+self.tag+'>')
class Parser(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root=Node('root');self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a,self.stack[-1]);self.stack[-1].children.append(n)
  if t not in VOID:self.stack.append(n)
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.handle_endtag(t)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,t):self.stack[-1].children.append(t)

def build(filename,method,title,caption,source):
 p=Parser();p.feed(Path(filename).read_text());nodes=list(p.root.all());form=next(n for n in nodes if n.attrs.get('id')=='printable-form');form.attrs={'class':'clinical-form form-container'}
 fields=[];sections=[];section='';context='';block=0
 for n in list(form.all()):
  if n.has('form-header'):
   section=n.text();block+=1;sections.append({'id':'clinical-section-'+str(block),'title':section});n.parent.attrs['id']='clinical-section-'+str(block)
  if n.has('form-subheader'):context=n.text()
  # Only reviewed presentation attributes survive.
  n.attrs={k:v for k,v in n.attrs.items() if k in ['class','style','colspan','rowspan','type','placeholder','id']}
  if n.tag not in ['input','textarea','select']:continue
  kind=n.attrs.get('type','text');assert kind in ['text','checkbox']
  key='f'+str(len(fields)+1).zfill(3)
  ownlabel=n.parent.text() if n.parent.tag=='label' else ''
  previous=[]
  for c in n.parent.children:
   if c is n:break
   if isinstance(c,Node) and c.has('lbl'):previous.append(c.text())
  label=ownlabel or (previous[-1] if previous else (context or section)+' — continuação')
  f={'id':key,'type':'boolean' if kind=='checkbox' else 'text','label':label,'section':section,'max':4000}
  fields.append(f)
  n.attrs.update({'data-field':key,'id':'clinical-'+key,'aria-label':section+' — '+label})
  if kind!='checkbox':
   n.attrs['maxlength']='4000'
   if not previous:n.tag='textarea';n.attrs.pop('type',None);n.attrs['rows']='2';n.attrs['class']='input-line clinical-notes'
  # References are not transferred to renderer as executable HTML.
 html=form.html()
 for n in list(form.all()):
  if n.tag in ['input','textarea','select']:
   key=n.attrs['data-field'];f=next(f for f in fields if f['id']==key)
   idx=n.parent.children.index(n)
   if f['type']=='boolean':
    n.parent.children.pop(idx)
    box=next(c for c in n.parent.children if isinstance(c,Node) and c.has('chk-box'))
    box.attrs={'class':'chk-box'};box.children=['{{check:'+key+'}}']
   else:
    n.tag='span';n.attrs={'class':'print-value'};n.children=['{{field:'+key+'}}']
 refs=next(n for n in nodes if n.has('refs'))
 items=[n.text() for n in refs.children if isinstance(n,Node) and n.tag in ['ol','p']]
 return {'id':method,'version':'1.0.0','title':title,'caption':caption,'source':source,'references':items,'fields':fields,'sections':sections,'html':html,'printHtml':form.html()}
forms=[build(sys.argv[1],'brasileiro','Modelo brasileiro — Coleta de dados','Anamnese, necessidades humanas e exame físico. Modelo do site baseado em Alba Lucia B. L. de Barros.','https://www.calculadorasdeenfermagem.com.br/instrumento_de_coleta_de_dados.html'),build(sys.argv[2],'americano','Modelo americano — Cabeça aos pés','Avaliação organizada da cabeça aos pés. Modelo do site com referências a Jarvis, Bates e Potter.','https://www.calculadorasdeenfermagem.com.br/formulario_avaliacao_da_cabeca_aos_pes.html')]
out=Path(__file__).resolve().parents[1]/'src/modules/anamnesis/templates.js'
out.write_text("/* Local, versioned forms extracted from the owner's sources. See docs/ANAMNESE.md. */\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NursingAnamnesis=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';return "+json.dumps(forms,ensure_ascii=False,separators=(',',':'))+";});\n")
print([(f['id'],len(f['fields']),len(f['sections'])) for f in forms])
