const fs = require('fs');

const input = 'C:/Users/kaues/Downloads/calculadoras-enfermagem-firebase-adminsdk-fbsvc-ef98cadc5b.json';
const output = 'C:/Users/kaues/Downloads/_fb_sa_oneline.txt';

const json = JSON.parse(fs.readFileSync(input, 'utf8'));
const oneline = JSON.stringify(json); // linha única, sem quebras de linha

fs.writeFileSync(output, oneline, 'utf8');
console.log('OK. Tamanho:', oneline.length, 'caracteres.');
console.log('Arquivo salvo em:', output);
