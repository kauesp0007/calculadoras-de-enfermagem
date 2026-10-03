'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),initSQL=require('sql.js');
const {Store}=require('../src/services/store'),perroca=require('../src/modules/perroca');
let SQL,temp;
before(async()=>{SQL=await initSQL();temp=fs.mkdtempSync(path.join(os.tmpdir(),'dimensioning-store-'));});
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
function setup(){return new Store(SQL,path.join(temp,crypto.randomUUID()+'.enfdb'),crypto.randomBytes(32));}
function scores(v=1){return Object.fromEntries(perroca.criteria.map(c=>[c.id,v]));}
test('Perroca e dimensionamento compartilham o mesmo banco e sobrevivem à reabertura',()=>{
 const store=setup();
 const saved=store.save({patient:{name:'Paciente adulto',prontuario:'P-01',birthdate:'1980-01-01',unit:'Clínica A',bed:'2'},assessment:{module_id:'perroca',scores:scores(1),professional:'Enfermeiro teste',eval_date:'2026-10-01',eval_time:'08:00'}});
 assert.equal(saved.assessment.total,13);assert.equal(saved.assessment.classification,'Cuidados mínimos');
 const scenario=store.dimensioningSave({name:'Clínica A — outubro',sector_type:'internacao',unit:'Clínica A',instrument:'perroca',reference_date:'2026-10-01',params:{chs:40,ist:15},result:{rounded:3}});
 assert.equal(scenario.instrument,'perroca');assert.equal(store.dimensioningList().length,1);
 const file=store.file,key=store.key;store.close();
 const reopened=new Store(SQL,file,key);
 assert.equal(reopened.history(saved.patient.id)[0].module_id,'perroca');
 assert.equal(reopened.dimensioningList()[0].result.rounded,3);
 assert.doesNotThrow(()=>reopened.validateImport(reopened.bytes()));
 reopened.close();
});
test('cenário inválido não é persistido e exclusão deixa auditoria',()=>{
 const store=setup();
 assert.throws(()=>store.dimensioningSave({name:'X',sector_type:'desconhecido',reference_date:'2026-10-01'}),/inválido/);
 const s=store.dimensioningSave({name:'APS',sector_type:'aps',reference_date:'2026-10-01',params:{},result:{rounded:2}});
 store.dimensioningDelete(s.id);
 assert.equal(store.dimensioningList().length,0);
 assert.equal(store.query("SELECT count(*) AS count FROM audit WHERE action='dimensioning:deleted'")[0].count,1);
 store.close();
});
