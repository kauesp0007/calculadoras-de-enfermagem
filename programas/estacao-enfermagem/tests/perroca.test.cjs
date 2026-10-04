'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),p=require('../src/modules/perroca');
function scores(v){return Object.fromEntries(p.criteria.map(c=>[c.id,v]));}
test('Perroca mantém 13 indicadores de 1 a 5',()=>{assert.equal(p.criteria.length,13);assert.equal(p.calculate(scores(1)).total,13);assert.equal(p.calculate(scores(1)).name,'Cuidados mínimos');assert.equal(p.calculate(scores(5)).total,65);assert.equal(p.calculate(scores(5)).name,'Cuidados intensivos');});
test('faixas da Perroca são contínuas',()=>{const v=scores(2);v.mental=3;assert.equal(p.calculate(v).total,27);assert.equal(p.calculate(v).name,'Cuidados intermediários');const s=scores(3);s.mental=4;assert.equal(p.calculate(s).total,40);assert.equal(p.calculate(s).name,'Cuidados semi-intensivos');});
test('Perroca recusa avaliação incompleta ou fora da faixa',()=>{const a=scores(1);delete a.mental;assert.throws(()=>p.calculate(a));const b=scores(1);b.mental=6;assert.throws(()=>p.calculate(b));});
