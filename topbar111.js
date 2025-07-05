// topbar.js

fetch("topbar111.html")
  .then(res => res.text())
  .then(data => {
    const header = document.createElement("header");
    header.innerHTML = data;
    document.body.prepend(header);

    // Após carregar, inicializa os menus
    initTopbarMenus();
  });

function initTopbarMenus() {
  // Abre/fecha o menu correspondente
  function toggleMenu(menuId) {
    const menus = document.querySelectorAll('.dropdown-menu');
    menus.forEach(menu => {
      if (menu.id === menuId) {
        menu.classList.toggle('show');
      } else {
        menu.classList.remove('show');
      }
    });
  }

  // Fecha os menus ao clicar fora
  document.addEventListener('click', function (event) {
    const isClickInside = event.target.closest('nav');
    if (!isClickInside) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });

  // Adiciona os eventos aos botões após o carregamento
  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      const menuId = button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (menuId) toggleMenu(menuId);
    });
  });
}
