/* eslint-env node */
const fs = require("fs");
const path = require("path");

const BIBLIOTECA_JSON = "biblioteca.json";

/**
 * Pastas monitoradas e suas categorias
 */
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];

/**
 * Gera título legível a partir do nome do ficheiro
 */
function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gera slug SEO-friendly a partir do título
 */
function slugFromTitulo(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Gera descrição automática para SEO
 */
function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

/**
 * Carrega biblioteca.json existente
 */
function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

/**
 * Salva biblioteca.json formatado
 */
function salvarBiblioteca(data) {
  fs.writeFileSync(
    BIBLIOTECA_JSON,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

/**
 * Scanner principal
 */
function executarScanner() {
  const biblioteca = carregarBiblioteca();

  // Evita duplicação usando o campo ficheiro
  const ficheirosExistentes = new Set(
    biblioteca.map(item => item.ficheiro)
  );

  let adicionados = 0;

  for (const pasta of PASTAS) {
    const pastaPath = path.join(process.cwd(), pasta.dir);

    if (!fs.existsSync(pastaPath)) continue;

    const arquivos = fs.readdirSync(pastaPath);

    for (const arquivo of arquivos) {
      const caminho = `/${pasta.dir}/${arquivo}`;

      if (ficheirosExistentes.has(caminho)) continue;

      const titulo = tituloFromFilename(arquivo);

      const novoItem = {
        titulo,
        slug: slugFromTitulo(titulo),
        descricao: descricaoAutomatica(titulo),
        categoria: pasta.categoria,
        ficheiro: caminho,
        capa:
          pasta.categoria === "fotos"
            ? caminho
            : "/img/capa-padrao.webp"
      };

      biblioteca.push(novoItem);
      adicionados++;
    }
  }

  salvarBiblioteca(biblioteca);

  console.log("✅ Scanner concluído com sucesso");
  console.log(`➕ Itens adicionados: ${adicionados}`);
}

executarScanner();
