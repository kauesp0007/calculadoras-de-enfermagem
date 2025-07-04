document.addEventListener('DOMContentLoaded', () => {
  fetch('topbar.html')
    .then(response => response.text())
    .then(data => {
      const container = document.createElement('div');
      container.innerHTML = data;
      document.body.insertBefore(container, document.body.firstChild);

      // Seleciona todos os menus com submenu
      const menus = container.querySelectorAll('.relative.group');

      menus.forEach(menu => {
        const button = menu.querySelector('button');
        const submenu = menu.querySelector('ul');

        if (!button || !submenu) return;

        // Toggle submenu no clique
        button.addEventListener('click', e => {
          e.preventDefault();
          const isHidden = submenu.classList.contains('hidden');
          // Fecha todos os outros submenus
          menus.forEach(m => m.querySelector('ul').classList.add('hidden'));
          // Abre ou fecha submenu atual
          if (isHidden) {
            submenu.classList.remove('hidden');
          } else {
            submenu.classList.add('hidden');
          }
        });
      });

      // Fecha menus ao clicar fora
      document.addEventListener('click', e => {
        menus.forEach(menu => {
          if (!menu.contains(e.target)) {
            const submenu = menu.querySelector('ul');
            if (submenu) submenu.classList.add('hidden');
          }
        });
      });
    })
    .catch(error => {
      console.error('Erro ao carregar a barra superior:', error);
    });
});
