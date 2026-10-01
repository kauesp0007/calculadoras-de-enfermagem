'use strict';
// Only reviewed, bundled modules may execute. No downloaded plugins or eval.
const fugulin=require('./fugulin');
const registry=Object.freeze({fugulin});
module.exports={registry,getModule(id){const mod=registry[id];if(!mod)throw new Error('Módulo não disponível nesta versão.');return mod;},listModules(){return Object.values(registry).map(m=>({id:m.id,name:m.name,version:m.version,population:m.population}));}};
