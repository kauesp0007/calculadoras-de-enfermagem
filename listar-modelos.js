require('dotenv').config();
const axios = require('axios');

const minhaChave = process.env.MINHA_CHAVE_GOOGLE;
// Endereço oficial do Google para listar modelos
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${minhaChave}`;

async function descobrirModelos() {
  console.log("🔍 Perguntando ao Google quais 'cérebros' estão disponíveis para sua chave...");
  
  try {
    const resposta = await axios.get(url);
    const lista = resposta.data.models;

    console.log("\n✅ SUCESSO! Aqui estão os modelos que você pode usar agora:");
    console.log("-------------------------------------------------------");
    
    // Vamos filtrar apenas os que servem para gerar texto (chat)
    const modelosDeTexto = lista.filter(m => m.supportedGenerationMethods.includes("generateContent"));

    modelosDeTexto.forEach(modelo => {
      // O Google devolve algo como "models/gemini-pro", vamos limpar para ficar fácil de ler
      const nomeLimpo = modelo.name.replace("models/", "");
      console.log(`➡️  "${nomeLimpo}"`);
    });
    
    console.log("-------------------------------------------------------");
    console.log("DICA: Copie um dos nomes acima (ex: gemini-1.5-flash) e coloque no seu arquivo teste-ia.js");

  } catch (erro) {
    console.error("\n❌ ERRO FATAL:");
    if (erro.response) {
        // O servidor respondeu com um erro
        console.error("Mensagem do Google:", JSON.stringify(erro.response.data, null, 2));
    } else {
        // Erro de conexão
        console.error(erro.message);
    }
  }
}

descobrirModelos();
