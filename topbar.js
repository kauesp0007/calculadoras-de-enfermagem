document.addEventListener("DOMContentLoaded", function () {
  fetch('topbar.html')
    .then(response => response.text())
    .then(data => {
      const container = document.createElement('div');
      container.innerHTML = data.trim();
      document.body.insertBefore(container.firstChild, document.body.firstChild);
    })
    .catch(error => {
      console.error('Erro ao carregar a barra superior:', error);
    });
});
