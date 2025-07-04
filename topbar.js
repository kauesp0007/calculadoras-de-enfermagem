// topbar.js

// Função para abrir e fechar submenu no hover e no clique (para mobile)
document.addEventListener('DOMContentLoaded', () => {
  // Seleciona todos os menus que possuem submenu
  const menus = document.querySelectorAll('.group');

  menus.forEach(menu => {
    const submenu = menu.querySelector('ul'); // submenu é a lista dentro do menu

    if (!submenu) return;

    // Controle de hover via CSS já funciona, mas adicionamos clique para mobile

    // Para clique: alterna a exibição do submenu
    menu.querySelector('button')?.addEventListener('click', e => {
      e.preventDefault();
      // Toggle display submenu
      if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
      } else {
        submenu.classList.add('hidden');
      }
    });

    // Fecha submenu ao clicar fora
    document.addEventListener('click', e => {
      if (!menu.contains(e.target)) {
        submenu.classList.add('hidden');
      }
    });
  });
});
