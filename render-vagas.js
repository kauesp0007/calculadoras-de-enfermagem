// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Seleciona o contêiner onde as vagas serão exibidas
    const vagasContainer = document.getElementById('vagas-container');

    // Mostra um estado de carregamento inicial
    vagasContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <svg class="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-600">Carregando vagas...</p>
        </div>
    `;

    try {
        // Faz a requisição para o arquivo JSON
        const response = await fetch('vagas.json');
        
        // Verifica se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error('Não foi possível carregar o arquivo vagas.json');
        }

        // Converte a resposta para JSON
        const vagas = await response.json();

        // Limpa o conteúdo de carregamento
        vagasContainer.innerHTML = '';

        if (vagas.length === 0) {
            // Se não houver vagas, mostra uma mensagem
            vagasContainer.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <p class="text-lg font-semibold mb-2">Ops! Nenhuma vaga encontrada no momento.</p>
                    <p class="text-sm">Tente novamente mais tarde ou ajuste os critérios de busca.</p>
                </div>
            `;
        } else {
            // Itera sobre as vagas e cria o HTML para cada uma
            vagas.forEach(vaga => {
                const vagaElement = document.createElement('div');
                vagaElement.classList.add('bg-white', 'p-6', 'rounded-2xl', 'shadow-md', 'border', 'border-gray-200', 'hover:shadow-lg', 'transition-shadow', 'duration-300');
                
                vagaElement.innerHTML = `
                    <h3 class="text-xl font-bold text-primary mb-2">
                        <a href="${vaga.link}" target="_blank" class="hover:text-accent-blue transition-colors">${vaga.titulo}</a>
                    </h3>
                    <!-- Você pode adicionar mais detalhes aqui se o seu scraper extraí-los, como empresa e localização -->
                `;
                
                vagasContainer.appendChild(vagaElement);
            });
        }
    } catch (error) {
        // Exibe uma mensagem de erro em caso de falha
        console.error('Erro ao carregar ou renderizar as vagas:', error);
        vagasContainer.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                <p class="text-lg font-semibold mb-2">Desculpe, ocorreu um erro.</p>
                <p class="text-sm">Não foi possível carregar as vagas no momento. Por favor, tente novamente.</p>
            </div>
        `;
    }
});
