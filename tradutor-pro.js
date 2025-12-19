const fs = require('fs');
const path = require('path');
const glob = require('glob');
const deepl = require('deepl-node');

// =====================================================================
// CONFIGURAÇÕES DE USO (EDITE AQUI ANTES DE RODAR)
// =====================================================================

// 1. SUA CHAVE API DO DEEPL (Obrigatório)
// Se for conta gratuita, a chave deve terminar com ":fx"
const AUTH_KEY = '5cf2117b-8967-4e69-aac2-dc828e5f34b6:fx'; 

// 2. IDIOMA DE DESTINO (Mude para cada rodada)
// Códigos suportados pelo DeepL:
// 'nl'    -> Holandês
// 'pl'    -> Polonês
// 'uk'    -> Ucraniano
// 'sv'    -> Sueco
// 'en-US' -> Inglês Americano
// 'fr'    -> Francês
// 'de'    -> Alemão
const IDIOMA_DESTINO = 'nl'; // <--- ALTERE ESTE CÓDIGO

// 3. PASTA ALVO (Onde estão os arquivos html copiados)
// Exemplo: 'nl', 'pl', 'uk', 'sv'
const PASTA_ALVO = 'nl'; // <--- ALTERE O NOME DA PASTA

// =====================================================================
// SCRIPT DE TRADUÇÃO PROFISSIONAL (NÃO ALTERE ABAIXO)
// =====================================================================

// Inicializa o tradutor
const translator = new deepl.Translator(AUTH_KEY);

// Busca arquivos HTML na pasta alvo
const files = glob.sync(`${PASTA_ALVO}/**/*.html`, {
    ignore: ['**/node_modules/**', '**/assets/**', '**/css/**', '**/js/**'],
    nodir: true
});

(async () => {
    console.log(`\n=================================================`);
    console.log(` INICIANDO TRADUÇÃO VIA DEEPL AI`);
    console.log(`=================================================`);
    console.log(`Target Language: ${IDIOMA_DESTINO.toUpperCase()}`);
    console.log(`Target Folder..: ./${PASTA_ALVO}`);
    console.log(`Arquivos encontrados: ${files.length}`);
    console.log(`-------------------------------------------------\n`);

    if (files.length === 0) {
        console.error(`❌ ERRO: Nenhum arquivo .html encontrado na pasta '${PASTA_ALVO}'.`);
        console.error(`DICA: Crie a pasta '${PASTA_ALVO}' e copie os arquivos originais (PT) para dentro dela antes de traduzir.`);
        return;
    }

    // Verifica cota de uso (apenas informativo)
    try {
        const usage = await translator.getUsage();
        if (usage.character) {
            console.log(`📊 Status da Cota Gratuita:`);
            console.log(`   Usado: ${usage.character.count} caracteres`);
            console.log(`   Limite: ${usage.character.limit} caracteres`);
            console.log(`   Disponível: ${usage.character.limit - usage.character.count} caracteres\n`);
        }
    } catch (e) {
        console.log("⚠️  Aviso: Não foi possível verificar o saldo da cota.\n");
    }

    // Loop de tradução
    for (const file of files) {
        console.log(`🔄 Traduzindo: ${path.basename(file)}...`);
        
        try {
            const htmlContent = fs.readFileSync(file, 'utf8');

            // Envia para o DeepL com proteção de HTML
            const result = await translator.translateText(
                htmlContent, 
                null, // null = detectar idioma de origem automaticamente (Português)
                IDIOMA_DESTINO, 
                { 
                    tagHandling: 'html', // Vital: Protege as tags <div>, <script>, class="", etc.
                    splitSentences: 'nonewlines' // Tenta manter a estrutura de parágrafos
                }
            );

            // Grava o arquivo traduzido por cima do original da pasta alvo
            fs.writeFileSync(file, result.text, 'utf8');
            console.log(`✅ Sucesso!`);

        } catch (error) {
            console.error(`❌ FALHA em ${file}:`);
            console.error(`   Motivo: ${error.message}`);
            
            if (error.message.includes('Quota exceeded')) {
                console.error(`\n🚨 PARE TUDO: Sua cota mensal do DeepL acabou.`);
                process.exit(1);
            }
        }
    }

    console.log(`\n=================================================`);
    console.log(` TRADUÇÃO CONCLUÍDA`);
    console.log(`=================================================`);
})();
