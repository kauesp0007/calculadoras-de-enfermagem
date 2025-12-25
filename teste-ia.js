require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Pega a sua chave do arquivo .env
// IMPORTANTE: Certifique-se que no seu arquivo .env o nome é MINHA_CHAVE_GOOGLE
const genAI = new GoogleGenerativeAI(process.env.MINHA_CHAVE_GOOGLE);

async function rodarIA() {
  console.log("🤖 A IA está lendo o texto...");

  // Escolhe o modelo (o cérebro da IA)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const textoParaResumir = `
    A Escala de Braden é uma ferramenta clinicamente validada que permite aos enfermeiros 
    e profissionais de saúde avaliar o risco de um paciente desenvolver lesões por pressão. 
    Ela avalia seis critérios: percepção sensorial, umidade, atividade, mobilidade, 
    nutrição e fricção/cisalhamento.
  `;

  const prompt = `Resuma o texto abaixo para um estudante de enfermagem, usando tópicos simples: ${textoParaResumir}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("\n--- RESPOSTA DO GEMINI ---");
    console.log(text);
    console.log("--------------------------");
  } catch (erro) {
    console.error("Ops! Algo deu errado:", erro);
  }
}

rodarIA();