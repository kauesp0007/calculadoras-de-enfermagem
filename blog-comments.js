document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsDisplay = document.getElementById('comments-display');

    const db = window.db; // Obtém a instância do Firestore do escopo global

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
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            renderComment(doc.data());
        });
    }

    // Função para lidar com o envio de um novo comentário
    commentForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio do formulário padrão
        
        const name = document.getElementById('comment-name').value;
        const text = document.getElementById('comment-text').value;

        try {
            await addDoc(collection(db, "comments"), {
                name: name,
                text: text,
                timestamp: serverTimestamp()
            });
            console.log("Comentário adicionado com sucesso!");
            commentForm.reset();
            getComments(); // Atualiza a lista de comentários
        } catch (e) {
            console.error("Erro ao adicionar o comentário: ", e);
        }
    });

    // Chama a função para exibir os comentários quando a página carregar
    getComments();
});
