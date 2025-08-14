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
    function getComments() {
        commentsDisplay.innerHTML = ''; // Limpa os comentários existentes
        db.collection("comments").orderBy("timestamp", "desc").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                renderComment(doc.data());
            });
        });
    }

    // Função para lidar com o envio de um novo comentário
    commentForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio do formulário padrão
        
        const name = document.getElementById('comment-name').value;
        const text = document.getElementById('comment-text').value;

        db.collection("comments").add({
            name: name,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log("Comentário adicionado com sucesso!");
            commentForm.reset();
            getComments(); // Atualiza a lista de comentários
        })
        .catch((error) => {
            console.error("Erro ao adicionar o comentário: ", error);
        });
    });

    // Chama a função para exibir os comentários quando a página carregar
    getComments();
});
