// build-pdf.js
const fs = require("fs");
const path = require("path");

// Pastas e arquivos
const pastaPDFs = "./provas-pdf";
const arquivoJSON = "./biblioteca-provas.json";

// Função para extrair informações do nome do arquivo
function extrairInfoDoNome(nomeArquivo) {
  // Remove a extensão .pdf
  const nomeSemExtensao = nomeArquivo.replace(".pdf", "");

  // Separa as partes pelo underscore _
  const partes = nomeSemExtensao.split("_");

  // Estrutura esperada:
  // CARGO_BANCA_INSTITUICAO_CIDADE_ESTADO_ANO
  // Ex: Tecnico_Enfermagem_FGV_MPU_Brasilia_DF_2025

  if (partes.length >= 7) {
    const cargo = partes[0] + "_" + partes[1]; // Tecnico_Enfermagem
    const banca = partes[2]; // FGV
    const instituicao = partes[3]; // MPU
    const cidade = partes[4]; // Brasilia
    const estado = partes[5]; // DF
    const ano = parseInt(partes[6]); // 2025

    // Determina o nivel baseado no cargo
    let nivel = "Medio";
    if (
      cargo.toLowerCase().includes("enfermeiro") ||
      cargo.toLowerCase().includes("analista")
    ) {
      nivel = "Superior";
    }

    // Monta o titulo legivel
    let titulo = "";
    if (cargo.toLowerCase().includes("tecnico")) {
      titulo = `${instituicao} - Tecnico em Enfermagem`;
    } else if (cargo.toLowerCase().includes("enfermeiro")) {
      titulo = `${instituicao} - Enfermeiro`;
    } else {
      titulo = `${instituicao} - ${cargo.replace("_", " ")}`;
    }

    // Monta a descricao automatica
    const descricao = `Concurso publico para ${cargo.replace("_", " ")} da ${instituicao}. Prova aplicada pela banca ${banca} no ano de ${ano}. Material oficial para estudo e preparacao.`;

    // Monta o resumo
    const resumo = `Prova para ${cargo.replace("_", " ")} com gabarito oficial.`;

    return {
      nomeArquivo: nomeArquivo,
      titulo: titulo,
      banca: banca,
      ano: ano,
      cargo: cargo.replace("_", " "),
      nivel: nivel,
      instituicao: instituicao,
      cidade: cidade,
      estado: estado,
      pdf_url: `/provas-pdf/${nomeArquivo}`,
      gabarito_url: `/provas-pdf/${nomeArquivo}`,
      descricao: descricao,
      questoes: 60,
      resumo: resumo,
    };
  }

  return null;
}

// Função principal
function buildBiblioteca() {
  console.log("=== BUILD DA BIBLIOTECA DE PROVAS ===\n");

  // Verifica se a pasta de PDFs existe
  if (!fs.existsSync(pastaPDFs)) {
    console.log(`Erro: A pasta "${pastaPDFs}" não existe.`);
    console.log(`Crie a pasta e coloque os arquivos PDF dentro dela.`);
    return;
  }

  // Ler todos os arquivos da pasta
  const arquivos = fs.readdirSync(pastaPDFs);

  // Filtrar apenas arquivos .pdf
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

  // Array para armazenar as provas
  const provas = [];
  let id = 1;

  // Processar cada PDF
  for (const arquivo of arquivosPDF) {
    console.log(`Processando: ${arquivo}`);
    const info = extrairInfoDoNome(arquivo);

    if (info) {
      info.id = id;
      provas.push(info);
      console.log(`  -> OK! Adicionado como ID ${id}: ${info.titulo}\n`);
      id++;
    } else {
      console.log(`  -> ERRO! Nome do arquivo não segue o padrão esperado.\n`);
      console.log(
        `  -> Padrão esperado: CARGO_BANCA_INSTITUICAO_CIDADE_ESTADO_ANO.pdf`,
      );
      console.log(
        `  -> Exemplo: Tecnico_Enfermagem_FGV_MPU_Brasilia_DF_2025.pdf\n`,
      );
    }
  }

  // Criar o objeto da biblioteca
  const biblioteca = {
    provas: provas,
  };

  // Salvar o arquivo JSON
  fs.writeFileSync(arquivoJSON, JSON.stringify(biblioteca, null, 2));

  console.log("====================================");
  console.log(`✅ Biblioteca atualizada com sucesso!`);
  console.log(`✅ Total de provas no banco: ${provas.length}`);
  console.log(`✅ Arquivo salvo: ${arquivoJSON}`);
  console.log("====================================");
}

// Executar a funcao principal
buildBiblioteca();
