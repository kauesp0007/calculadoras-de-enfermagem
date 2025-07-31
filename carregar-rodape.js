// Este script será salvo no arquivo carregar-rodape.js

// Aguarda o conteúdo da página ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {
    
    // Encontra o elemento no HTML onde o rodapé será inserido.
    // Você precisa ter um <div id="footer-container"></div> na sua página.
    const footerContainer = document.getElementById('footer-container');

    // Verifica se o container do rodapé realmente existe na página
    if (footerContainer) {
        // Usa a API fetch para buscar o conteúdo do arquivo rodape.html
        fetch('rodape.html')
            .then(response => {
                // Verifica se a requisição foi bem-sucedida
                if (!response.ok) {
                    throw new Error('Não foi possível carregar o rodapé. Status: ' + response.status);
                }
                // Converte a resposta em texto (o código HTML do rodapé)
                return response.text();
            })
            .then(data => {
                // Insere o HTML do rodapé dentro do container
                footerContainer.innerHTML = data;
            })
            .catch(error => {
                // Exibe um erro no console caso algo dê errado
                console.error('Erro ao carregar o rodapé:', error);
                footerContainer.innerHTML = '<p style="text-align: center; color: red;">Erro ao carregar o conteúdo do rodapé.</p>';
            });
    }
});
