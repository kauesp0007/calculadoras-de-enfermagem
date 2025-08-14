document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsDisplay = document.getElementById('comments-display');

    // Função para renderizar um único comentário
    function renderComment(comment) {
        const commentElement = document.createElement('div');
        commentElement.classList.add('bg-neutral-light', 'p-4', 'rounded-lg');
        
        const date = comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'Data Indisponível';
        
        commentElement.innerHTML = `
            <p class="text-sm font-bold text-gray-800">${comment.name} <span class="text-xs font-normal text-gray-500">- ${date}</span></p>
            <p class="text-gray-600 mt-2">${comment.text}</p>
        `;
        commentsDisplay.appendChild(commentElement);
    }

    // Função para buscar e exibir os comentários do Firestore
    async function getComments() {
        commentsDisplay.innerHTML = ''; // Limpa os comentários existentes
        
        // Assegura que o 'db' esteja disponível antes de tentar buscar os comentários
        if (typeof window.db === 'undefined') {
            console.error("Firestore 'db' not initialized.");
            return;
        }

        const commentsRef = window.collection(window.db, "comments");
        const q = window.query(commentsRef, window.orderBy("timestamp", "desc"));
        
        try {
            const querySnapshot = await window.getDocs(q);
            querySnapshot.forEach((doc) => {
                renderComment(doc.data());
            });
        } catch (e) {
            console.error("Erro ao buscar comentários: ", e);
        }
    }

    // Função para lidar com o envio de um novo comentário
    commentForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio do formulário padrão
        
        const name = document.getElementById('comment-name').value;
        const text = document.getElementById('comment-text').value;

        if (!name || !text) {
            alert("Nome e comentário são obrigatórios.");
            return;
        }

        try {
            await window.addDoc(window.collection(window.db, "comments"), {
                name: name,
                text: text,
                timestamp: window.serverTimestamp()
            });
            console.log("Comentário adicionado com sucesso!");
            commentForm.reset();
            getComments(); // Atualiza a lista de comentários
        } catch (e) {
            console.error("Erro ao adicionar o comentário: ", e);
            alert("Erro ao enviar o comentário. Verifique as regras do Firebase.");
        }
    });

    // Chama a função para exibir os comentários quando a página carregar
    getComments();
});
