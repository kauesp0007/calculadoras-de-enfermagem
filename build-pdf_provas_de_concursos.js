// build-pdf.js
const fs = require("fs");
const path = require("path");

// Pastas e arquivos
const pastaPDFs = "./provas-pdf";
const arquivoJSON = "./biblioteca-provas.json";

// Bancas conhecidas (maiusculas)
const BANCAS = [
  "FGV", "FUVEST", "VUNESP", "CESPE", "CEBRASPE", "FCC", "CESGRANRIO",
  "FUNCAB", "FUNRIO", "IBFC", "IDECAN", "IADES", "QUADRIX", "AOCP",
  "FUNDEP", "FUMARC", "UFMT", "UFPR", "UFSC", "UFRJ", "FUNCAMP",
  "INSTITUTO VERBENA", "VERBENA", "CEFET", "COMPERVE", "MS CONCURSOS",
  "CONSULPLAN", "INSTITUTO AOCP", "SELECON", "UNIRV",
];

// Estados brasileiros (siglas)
const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Cidades conhecidas (para ajudar no parsing)
const CIDADES = [
  "BRASILIA", "SAO PAULO", "RIO DE JANEIRO", "BELO HORIZONTE", "CAMPINAS",
  "CURITIBA", "PORTO ALEGRE", "SALVADOR", "FORTALEZA", "RECIFE",
  "GOIANIA", "MANAUS", "BELEM", "FLORIANOPOLIS", "NATAL", "VITORIA",
  "CAMPO GRANDE", "CUIABA", "ARACAJU", "JOAO PESSOA", "TERESINA",
  "MACAPA", "RIO BRANCO", "PALMAS", "BOA VISTA", "SAO LUIS",
  "MACEIO", "PORTO VELHO", "UBERLANDIA", "JUIZ DE FORA", "CARAGUATATUBA",
  "FLORES DE GOIAS", "FLORES", "GOIANIA",
];

/**
 * Extrai o ano do nome do arquivo (primeiro numero de 4 digitos entre 1990-2030)
 */
function extrairAno(partes) {
  for (const p of partes) {
    const n = parseInt(p);
    if (!isNaN(n) && n >= 1990 && n <= 2030) {
      return n;
    }
  }
  return null;
}

/**
 * Encontra uma banca conhecida nas partes do nome
 */
function extrairBanca(partes) {
  const nomeUpper = partes.join(" ").toUpperCase();
  for (const banca of BANCAS) {
    if (nomeUpper.includes(banca)) {
      // Retorna a banca com capitalizacao correta
      return BANCAS.find(b => b.toUpperCase() === banca) || banca;
    }
  }
  return null;
}

/**
 * Encontra um estado (sigla) nas partes
 */
function extrairEstado(partes) {
  for (let i = partes.length - 1; i >= 0; i--) {
    const p = partes[i].toUpperCase();
    if (ESTADOS.includes(p)) {
      return { sigla: p, indice: i };
    }
  }
  return null;
}

/**
 * Determina o cargo (Enfermeiro ou Tecnico em Enfermagem)
 */
function extrairCargo(partes) {
  const nome = partes.join(" ").toUpperCase();
  if (nome.includes("TECNICO") || nome.includes("TÉCNICO")) {
    return { cargo: "Tecnico em Enfermagem", nivel: "Medio" };
  }
  if (nome.includes("ENFERMEIRO") || nome.includes("ENFERMEIRA")) {
    return { cargo: "Enfermeiro", nivel: "Superior" };
  }
  return { cargo: "Enfermagem", nivel: "Superior" };
}

/**
 * Função principal para extrair informações do nome do arquivo
 * Suporta multiplos formatos de nomenclatura
 */
function extrairInfoDoNome(nomeArquivo) {
  const nomeSemExtensao = nomeArquivo.replace(/\.pdf$/i, "");
  const partes = nomeSemExtensao.split("_");

  const ano = extrairAno(partes);
  const banca = extrairBanca(partes);
  const estadoInfo = extrairEstado(partes);
  const { cargo, nivel } = extrairCargo(partes);

  // Tenta montar um titulo legivel a partir das partes
  // Remove partes que sao ano, estado, banca, "prova", "superior", "medio"
  const partesFiltradas = partes.filter(p => {
    const up = p.toUpperCase();
    if (/^\d{4}$/.test(p)) return false; // ano
    if (ESTADOS.includes(up)) return false; // estado
    if (up === "PROVA" || up === "SUPERIOR" || up === "MEDIO" || up === "FUNDAMENTAL") return false;
    return true;
  });

  // Junta as partes restantes para formar instituicao + cidade
  let instituicao = "";
  let cidade = "";

  if (estadoInfo && partesFiltradas.length >= 2) {
    // Assume que a ultima parte antes do estado eh a cidade, resto eh instituicao
    const idxCidade = estadoInfo.indice - 1;
    if (idxCidade >= 0 && idxCidade < partes.length) {
      cidade = partes[idxCidade].replace(/_/g, " ");
      // Resto antes da cidade (excluindo ano, banca, cargo)
      const antes = partes.slice(0, idxCidade).filter(p => {
        const up = p.toUpperCase();
        if (/^\d{4}$/.test(p)) return false;
        if (up === "PROVA") return false;
        return true;
      });
      instituicao = antes.join(" ").replace(/_/g, " ");
    }
  }

  // Fallback: usa partesFiltradas para instituicao
  if (!instituicao && partesFiltradas.length > 0) {
    instituicao = partesFiltradas.join(" ").replace(/_/g, " ");
  }

  // Se nao tem instituicao, usa o nome do arquivo como titulo
  if (!instituicao || instituicao.length < 2) {
    instituicao = nomeSemExtensao.replace(/_/g, " ").replace(/\.pdf$/i, "");
  }

  // Titulo bonito
  const titulo = `${instituicao} - ${cargo}`;

  // Descricao
  let descricao = `Prova para ${cargo}`;
  if (instituicao) descricao += ` - ${instituicao}`;
  if (banca) descricao += `. Banca: ${banca}`;
  if (ano) descricao += `. Ano: ${ano}`;
  descricao += ". Material oficial para estudo e preparacao.";

  // Resumo
  let resumo = `Prova para ${cargo}`;
  if (banca) resumo += ` (${banca})`;
  if (ano) resumo += ` ${ano}`;
  resumo += " com gabarito oficial.";

  return {
    nomeArquivo: nomeArquivo,
    titulo: titulo,
    banca: banca || "Não identificada",
    ano: ano,
    cargo: cargo,
    nivel: nivel,
    instituicao: instituicao,
    cidade: cidade || "",
    estado: estadoInfo ? estadoInfo.sigla : "",
    pdf_url: `/provas-pdf/${nomeArquivo}`,
    gabarito_url: `/provas-pdf/${nomeArquivo}`,
    descricao: descricao,
    questoes: 60,
    resumo: resumo,
  };
}

/**
 * Carrega a biblioteca existente ou cria uma nova
 */
function carregarBiblioteca() {
  if (fs.existsSync(arquivoJSON)) {
    try {
      return JSON.parse(fs.readFileSync(arquivoJSON, "utf8"));
    } catch (e) {
      console.log("Erro ao ler JSON existente, criando novo.");
    }
  }
  return { provas: [] };
}

/**
 * Build completo: reconstroi toda a biblioteca a partir dos PDFs da pasta
 */
function buildBiblioteca() {
  console.log("=== BUILD DA BIBLIOTECA DE PROVAS ===\n");

  if (!fs.existsSync(pastaPDFs)) {
    console.log(`Erro: A pasta "${pastaPDFs}" não existe.`);
    console.log(`Crie a pasta e coloque os arquivos PDF dentro dela.`);
    return;
  }

  const arquivos = fs.readdirSync(pastaPDFs);
  const arquivosPDF = arquivos.filter((arquivo) =>
    arquivo.toLowerCase().endsWith(".pdf"),
  );

  if (arquivosPDF.length === 0) {
    console.log(`Nenhum arquivo PDF encontrado na pasta "${pastaPDFs}".`);
    return;
  }

  console.log(`Encontrados ${arquivosPDF.length} arquivos PDF:\n`);
  arquivosPDF.forEach((pdf) => console.log(`  - ${pdf}`));
  console.log("\n---\n");

  const provas = [];
  let id = 1;

  for (const arquivo of arquivosPDF) {
    console.log(`Processando: ${arquivo}`);
    const info = extrairInfoDoNome(arquivo);

    info.id = id;
    provas.push(info);
    console.log(`  -> OK! ID ${id}: ${info.titulo}`);
    console.log(`     Banca: ${info.banca} | Ano: ${info.ano} | ${info.cargo}\n`);
    id++;
  }

  const biblioteca = { provas };
  fs.writeFileSync(arquivoJSON, JSON.stringify(biblioteca, null, 2));

  console.log("====================================");
  console.log(`✅ Biblioteca atualizada com sucesso!`);
  console.log(`✅ Total de provas: ${provas.length}`);
  console.log(`✅ Arquivo: ${arquivoJSON}`);
  console.log("====================================");
}

/**
 * Adiciona um unico PDF ao JSON existente (modo incremental para o watcher)
 */
function adicionarPDF(nomeArquivo) {
  if (!nomeArquivo.toLowerCase().endsWith(".pdf")) return;

  const biblioteca = carregarBiblioteca();

  // Verifica se ja existe
  const existente = biblioteca.provas.find(
    (p) => p.nomeArquivo === nomeArquivo
  );
  if (existente) {
    console.log(`⏭  PDF já existe na biblioteca: ${nomeArquivo}`);
    return;
  }

  const info = extrairInfoDoNome(nomeArquivo);
  info.id = biblioteca.provas.length + 1;
  biblioteca.provas.push(info);

  fs.writeFileSync(arquivoJSON, JSON.stringify(biblioteca, null, 2));
  console.log(`✅ PDF adicionado: ${info.titulo} (ID ${info.id})`);
}

// Exportar para uso pelo watcher e manter execucao direta
module.exports = { buildBiblioteca, adicionarPDF };

// Se executado diretamente (node build-pdf.js), faz build completo
if (require.main === module) {
  buildBiblioteca();
}
