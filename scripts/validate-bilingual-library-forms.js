#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const requiredLibraryEnglish = ["Nursing Library", "Digital Collection", "Search the library"];
const formSlugs = [
  "glasgow","gosnell","hamilton","hendrich","humpty","johns","jouvet",
  "lachs","lanss","lawton","meows","news","nips"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const listingFiles = ["downloads.html"];
if (fs.existsSync(path.join(root, "downloads"))) {
  listingFiles.push(
    ...fs.readdirSync(path.join(root, "downloads"))
      .filter(name => /^page\d+\.html$/i.test(name))
      .map(name => path.join("downloads", name))
  );
}

for (const rel of listingFiles) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  assert(html.includes('lang="en"'), "Biblioteca sem bloco EN em " + rel);
  for (const phrase of requiredLibraryEnglish) {
    assert(html.includes(phrase), "Biblioteca sem texto EN esperado em " + rel + ": " + phrase);
  }
}

const itemDir = path.join(root, "biblioteca");
if (fs.existsSync(itemDir)) {
  for (const name of fs.readdirSync(itemDir).filter(n => n.toLowerCase().endsWith(".html"))) {
    const rel = path.join("biblioteca", name);
    const html = fs.readFileSync(rel, "utf8");
    assert(html.includes('lang="en"'), "Item da biblioteca sem bloco EN: " + rel);
    assert(html.includes("Nursing Library"), "Item da biblioteca sem 'Nursing Library': " + rel);
  }
}

for (const slug of formSlugs) {
  const rel = "formulario_escala_de_" + slug + ".html";
  assert(fs.existsSync(path.join(root, rel)), "Formulário ausente: " + rel);
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  assert(html.includes('lang="en"'), "Formulário sem bloco EN: " + rel);
  assert(html.includes("Printable form"), "Formulário sem 'Printable form': " + rel);
}

console.log("OK: Biblioteca de Enfermagem e 13 formulários validados PT → EN.");
