/* eslint-env node */
const fs = require("fs");
const path = require("path");

const BIBLIOTECA_JSON = "biblioteca.json";

/**
 * Pastas monitoradas
 */
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];

/**
 * Gera título amigável
 */
function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gera slug SEO
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
 * Descrição automática
 */
function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

/**
 * Capa padrão por categoria
 */
function capaPadrao(categoria, ficheiro) {
  if (categoria === "fotos") return ficheiro;
  if (categoria === "documentos") return "/img/capa-word.webp";
  if (categoria === "videos") return "/img/capa-video.webp";
  return "/img/capa-padrao.webp";
}

/**
 * Carrega biblioteca.json
 */
function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

/**
 * Salva biblioteca.json
 */
function salvarBiblioteca(data) {
  fs.writeFileSync(
    BIBLIOTECA_JSON,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

/**
 * Scanner principal (ATUALIZA + ADICIONA)
 */
function executarScanner() {
  let biblioteca = carregarBiblioteca();

  // Indexa por ficheiro (chave única)
  const index = {};
  biblioteca.forEach(item => {
    index[item.ficheiro] = item;
  });

  let adicionados = 0;
  let atualizados = 0;

  for (const pasta of PASTAS) {
    const pastaPath = path.join(process.cwd(), pasta.dir);
    if (!fs.existsSync(pastaPath)) continue;

    const arquivos = fs.readdirSync(pastaPath);

    for (const arquivo of arquivos) {
      const ficheiro = `/${pasta.dir}/${arquivo}`;
      const titulo = tituloFromFilename(arquivo);

      if (index[ficheiro]) {
        // 🔁 ATUALIZA ITEM EXISTENTE
        index[ficheiro].titulo = titulo;
        index[ficheiro].slug = slugFromTitulo(titulo);
        index[ficheiro].descricao = descricaoAutomatica(titulo);
        index[ficheiro].categoria = pasta.categoria;
        index[ficheiro].capa = capaPadrao(pasta.categoria, ficheiro);
        atualizados++;
      } else {
        // ➕ NOVO ITEM
        biblioteca.push({
          titulo,
          slug: slugFromTitulo(titulo),
          descricao: descricaoAutomatica(titulo),
          categoria: pasta.categoria,
          ficheiro,
          capa: capaPadrao(pasta.categoria, ficheiro)
        });
        adicionados++;
      }
    }
  }

  salvarBiblioteca(biblioteca);

  console.log("✅ Scanner finalizado");
  console.log(`➕ Novos itens: ${adicionados}`);
  console.log(`🔁 Itens atualizados: ${atualizados}`);
}

executarScanner();
