fetch('topbar.html')
  .then(response => response.text())
  .then(data => {
    const container = document.createElement('div');
    container.innerHTML = data;
    document.body.insertBefore(container, document.body.firstChild);

    const menus = container.querySelectorAll('div[style*="position: relative"]');
    menus.forEach(menu => {
      menu.addEventListener('mouseenter', () => {
        const submenu = menu.querySelector('div[style*="position: absolute"]');
        if (submenu) submenu.style.display = 'block';
      });
      menu.addEventListener('mouseleave', () => {
        const submenu = menu.querySelector('div[style*="position: absolute"]');
        if (submenu) submenu.style.display = 'none';
      });
    });
  })
  .catch(error => {
    console.error('Erro ao carregar a barra superior:', error);
  });
