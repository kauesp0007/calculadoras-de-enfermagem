/* eslint-env node */
const fs = require("fs");
const path = require("path");

const BIBLIOTECA_JSON = "biblioteca.json";

const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" },
];

function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function slugFromTitulo(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function descricaoAutomatica(titulo, categoria) {
  if (categoria === "fotos")
    return `Imagem ilustrativa e material visual sobre ${titulo} para apoio educacional e clínico.`;
  if (categoria === "documentos")
    return `Documento completo e material de estudo em PDF sobre ${titulo} para consulta e prática de enfermagem.`;
  if (categoria === "videos")
    return `Vídeo explicativo e demonstração prática sobre ${titulo}, detalhando procedimentos e conceitos clínicos fundamentais.`;
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

// ==========================================
// NOVA FUNÇÃO: Motor de Palavras-Chave (SEO)
// ==========================================
function gerarKeywords(titulo) {
  const t = titulo.toLowerCase();

  // Palavras-chave padrão base garantidas em todos os itens
  let keywords = new Set([
    "enfermagem",
    "saúde",
    "estudo",
    "clínica",
    "material de apoio",
  ]);

  // Dicionário Inteligente de Sinónimos e Termos Relacionados
  const dicionario = {
    cranio: ["cabeça", "sistema ósseo", "anatomia", "neurologia", "cérebro"],
    crânio: ["cabeça", "sistema ósseo", "anatomia", "neurologia", "cérebro"],
    coracao: [
      "sistema cardiovascular",
      "cardiologia",
      "anatomia",
      "sangue",
      "órgão vital",
    ],
    coração: [
      "sistema cardiovascular",
      "cardiologia",
      "anatomia",
      "sangue",
      "órgão vital",
    ],
    ferida: ["curativo", "lesão", "pele", "cicatrização", "dermatologia"],
    pressao: ["sinais vitais", "hipertensão", "hipotensão", "hemodinâmica"],
    pressão: ["sinais vitais", "hipertensão", "hipotensão", "hemodinâmica"],
    sangue: ["hematologia", "sistema circulatório", "exame", "coleta"],
    respiracao: [
      "sistema respiratório",
      "pulmão",
      "oxigenação",
      "sinais vitais",
    ],
    respiração: [
      "sistema respiratório",
      "pulmão",
      "oxigenação",
      "sinais vitais",
    ],
    medicamento: [
      "farmacologia",
      "administração",
      "terapia",
      "remédio",
      "prescrição",
    ],
    calculo: ["matemática", "dosagem", "fórmula", "administração"],
    cálculo: ["matemática", "dosagem", "fórmula", "administração"],
    idoso: ["geriatria", "envelhecimento", "cuidados", "gerontologia"],
    crianca: ["pediatria", "infantil", "cuidados", "desenvolvimento"],
    criança: ["pediatria", "infantil", "cuidados", "desenvolvimento"],
    osso: ["sistema esquelético", "ortopedia", "anatomia", "fratura"],
    musculo: ["sistema muscular", "anatomia", "força", "movimento"],
    músculo: ["sistema muscular", "anatomia", "força", "movimento"],
    utero: ["ginecologia", "obstetrícia", "anatomia feminina", "reprodução"],
    útero: ["ginecologia", "obstetrícia", "anatomia feminina", "reprodução"],
    pulmao: ["sistema respiratório", "respiração", "anatomia", "órgão"],
    pulmão: ["sistema respiratório", "respiração", "anatomia", "órgão"],
    rim: ["sistema excretor", "nefrologia", "anatomia", "urina"],
    rins: ["sistema excretor", "nefrologia", "anatomia", "urina"],
    figado: ["sistema digestório", "hepatologia", "anatomia", "metabolismo"],
    fígado: ["sistema digestório", "hepatologia", "anatomia", "metabolismo"],
    estomago: [
      "sistema digestório",
      "gastroenterologia",
      "anatomia",
      "digestão",
    ],
    estômago: [
      "sistema digestório",
      "gastroenterologia",
      "anatomia",
      "digestão",
    ],
  };

  // Varre o dicionário e se a palavra existir no título, adiciona os sinónimos
  for (const [chave, sinonimos] of Object.entries(dicionario)) {
    if (t.includes(chave)) {
      sinonimos.forEach((s) => keywords.add(s));
    }
  }

  // Converte o Set (que impede palavras repetidas) novamente para um Array
  return Array.from(keywords);
}

// ==========================================
// NOVA FUNÇÃO: Gerar Data Formatada (PT-BR)
// ==========================================
function obterDataAtual() {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
}

function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

function salvarBiblioteca(dados) {
  fs.writeFileSync(BIBLIOTECA_JSON, JSON.stringify(dados, null, 2));
}

function scan() {
  console.log(
    "🔍 A iniciar o scan da biblioteca à procura de novos ficheiros...",
  );
  const biblioteca = carregarBiblioteca();

  const ficheirosExistentes = new Set(biblioteca.map((item) => item.ficheiro));
  let adicionados = 0;

  for (const pasta of PASTAS) {
    const pastaPath = path.join(process.cwd(), pasta.dir);
    if (!fs.existsSync(pastaPath)) continue;

    const arquivos = fs.readdirSync(pastaPath);

    for (const arquivo of arquivos) {
      const caminho = `/${pasta.dir}/${arquivo}`;

      // Se o ficheiro já estiver na biblioteca, ignora para não subscrever dados
      if (ficheirosExistentes.has(caminho)) continue;

      const titulo = tituloFromFilename(arquivo);

      const novoItem = {
        titulo,
        slug: slugFromTitulo(titulo),
        descricao: descricaoAutomatica(titulo, pasta.categoria),
        keywords: gerarKeywords(titulo), // <--- INJEÇÃO DO ARRAY DINÂMICO
        meta_descricao: "",
        categoria: pasta.categoria,
        ficheiro: caminho,
        capa: pasta.categoria === "fotos" ? caminho : "",
        data_adicao: obterDataAtual(), // <--- INJEÇÃO DA DATA DO SISTEMA
      };

      biblioteca.push(novoItem);
      adicionados++;
    }
  }

  if (adicionados > 0) {
    salvarBiblioteca(biblioteca);
    console.log(
      `✅ Scanner concluído! ${adicionados} novo(s) arquivo(s) adicionado(s) com data e palavras-chave geradas no JSON.`,
    );
  } else {
    console.log("✅ Scanner concluído. Nenhum arquivo novo encontrado.");
  }
}

scan();
