// adicionar-provas.js
const fs = require("fs");

// Carregar o JSON existente
const bibliotecaPath = "./biblioteca-provas.json";
let biblioteca = JSON.parse(fs.readFileSync(bibliotecaPath, "utf8"));

// Nova prova a ser adicionada
const novaProva = {
  id: biblioteca.provas.length + 1,
  titulo: "Enfermagem - Hospital das Clinicas",
  banca: "FUVEST",
  ano: 2025,
  cargo: "Enfermeiro",
  nivel: "Superior",
  instituicao: "Hospital das Clinicas - FMUSP",
  cidade: "Sao Paulo",
  estado: "SP",
  pdf_url: "https://exemplo.com/prova.pdf",
  gabarito_url: "https://exemplo.com/gabarito.pdf",
  descricao: "Descricao completa da prova...",
  questoes: 80,
  resumo: "Resumo da prova...",
};

// Adicionar ao array
biblioteca.provas.push(novaProva);

// Salvar de volta ao arquivo
fs.writeFileSync(bibliotecaPath, JSON.stringify(biblioteca, null, 2));

console.log(`Prova "${novaProva.titulo}" adicionada com sucesso!`);
