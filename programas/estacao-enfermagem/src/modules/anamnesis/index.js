'use strict';
const templates=require('./templates');
const types=['Admissão','Reavaliação','Transferência','Alta','Outro'];
function model(id){const found=templates.find(t=>t.id===id);if(!found)throw new Error('Modelo de anamnese inválido.');return found;}
function text(v,max=180){if(v==null)return '';if(typeof v!=='string'||v.length>max)throw new Error('Campo da ficha inválido ou muito longo.');return v.trim();}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw new Error('Data da ficha inválida.');return v;}
function prepare(input,draft=false){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Ficha inválida.');
 const t=model(input.method_id);if(input.template_version!==t.version)throw new Error('Versão do formulário incompatível.');
 if(!Number.isSafeInteger(input.patient_id)||input.patient_id<1)throw new Error('Selecione um paciente cadastrado.');
 const v=input.values;if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Campos da ficha inválidos.');
 if(Object.keys(v).some(k=>!t.fields.some(f=>f.id===k)))throw new Error('A ficha contém campos desconhecidos.');
 const values={};for(const f of t.fields){const value=v[f.id];if(f.type==='boolean'){if(value!==undefined&&typeof value!=='boolean')throw new Error('Marcação da ficha inválida.');values[f.id]=value===true;}else values[f.id]=text(value,f.max);}
 if(JSON.stringify(values).length>300000)throw new Error('A ficha excede o tamanho permitido.');
 const professional=text(input.professional),coren=text(input.coren,80),record_type=types.includes(input.record_type)?input.record_type:null;
 if(!record_type)throw new Error('Tipo de registro inválido.');
 if(!draft&&!professional)throw new Error('Informe o enfermeiro responsável.');
 const eval_date=date(input.eval_date),eval_time=input.eval_time;if(typeof eval_time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(eval_time))throw new Error('Hora da ficha inválida.');
 const id=input.id??null,revision=input.revision??null;
 if(id!==null&&(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(revision)||revision<1))throw new Error('Revisão da ficha inválida.');
 return {id,revision,patient_id:input.patient_id,method_id:t.id,template_version:t.version,professional,coren,record_type,eval_date,eval_time,values};
}
function bindIdentity(record,snapshot){const t=model(record.method_id);const first=t.sections[0].title;for(const f of t.fields){let value;if(f.section===first){if(f.label==='NOME:')value=snapshot.name;if(f.label==='RG HOSPITALAR:')value=snapshot.prontuario;if(f.label==='LEITO:')value=snapshot.bed;if(f.label==='IDADE:'){value='';if(snapshot.birthdate){let age=Number(record.eval_date.slice(0,4))-Number(snapshot.birthdate.slice(0,4));if(record.eval_date.slice(5)<snapshot.birthdate.slice(5))age--;value=String(age);}}}if(f.label==='ENFERMEIRO(A):')value=record.professional;if(f.label==='COREN:')value=record.coren;if(f.label==='DATA:')value=record.eval_date.split('-').reverse().join('/');if(f.label==='HORA:')value=record.eval_time;if(value!==undefined)record.values[f.id]=value||'';}return record;}
module.exports={model,prepare,bindIdentity,types};
