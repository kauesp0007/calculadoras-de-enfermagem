document.addEventListener("DOMContentLoaded", function () {
  fetch('topbar.html')
    .then(response => response.text())
    .then(data => {
      // Cria um elemento temporário e insere o conteúdo do topbar.html
      const temp = document.createElement('div');
      temp.innerHTML = data.trim();

      // Extrai o primeiro elemento real do HTML (o header da topbar)
      const topbar = temp.querySelector('header');

      // Insere no topo do <body>
      if (topbar) {
        document.body.insertBefore(topbar, document.body.firstChild);
      } else {
        console.error("topbar.html não contém um <header>.");
      }
    })
    .catch(error => {
      console.error('Erro ao carregar a barra superior:', error);
    });
});
