
// topbar111.js

// Espera o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  // 1) Carrega o HTML da topbar
  fetch('topbar111.html')
    .then(res => {
      if (!res.ok) throw new Error(`Falha ao carregar topbar111.html: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const header = document.createElement('header');
      header.innerHTML = html;
      document.body.prepend(header);

      // 2) Inicializa o comportamento dos menus
      initTopbarMenus();
    })
    .catch(err => {
      console.error(err);
    });
});

// Função que adiciona os listeners aos botões e ao document
function initTopbarMenus() {
  // Ao clicar em um botão com data-menu-target, alterna seu dropdown
  document.querySelectorAll('[data-menu-target]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const menuId = btn.getAttribute('data-menu-target');
      // Fecha todos
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      // Abre o selecionado
      const toOpen = document.getElementById(menuId);
      if (toOpen) toOpen.classList.toggle('show');
    });
  });

  // Fecha dropdowns ao clicar fora da nav
  document.addEventListener('click', e => {
    if (!e.target.closest('nav')) {
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    }
  });
}
