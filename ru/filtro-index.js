/**
 * FILTRO DINÂMICO PARA AS GRELHAS DE CALCULADORAS (PÁGINA INDEX)
 * Este script "ouve" a caixa de pesquisa e filtra os cartões
 * em todas as grelhas da página (calculator-grid).
 */
function inicializarFiltroIndex() {
  // 1. Encontra os elementos na página
  const input = document.getElementById('filtro-calculadoras-input');
  const grids = document.querySelectorAll('.calculator-grid');

  // 2. Se não houver caixa de pesquisa nesta página, não faz nada
  if (!input || grids.length === 0) {
    return;
  }

  // 3. Função que faz o filtro
  function filtrarCartoes() {
    const termo = input.value.toLowerCase().trim();
    let totalVisivel = 0;

    // 4. Passa por cada grelha (ex: "Calculadoras", "Escalas", "Vacinas")
    grids.forEach(grid => {
      let cartoesNaGrelha = 0;
      let cartoesVisiveisNestaGrelha = 0;

      const cartoes = grid.querySelectorAll('a'); // Apanha todos os cartões (links)

      // 5. Passa por cada cartão dentro da grelha
      cartoes.forEach(cartao => {
        cartoesNaGrelha++;
        const titulo = cartao.querySelector('h3')?.textContent.toLowerCase() || '';
        const descricao = cartao.querySelector('p')?.textContent.toLowerCase() || '';

        // 6. Verifica se o texto do cartão corresponde ao termo da pesquisa
        if (titulo.includes(termo) || descricao.includes(termo)) {
          cartao.style.display = 'flex'; // Mostra o cartão
          cartoesVisiveisNestaGrelha++;
        } else {
          cartao.style.display = 'none'; // Esconde o cartão
        }
      });

      // 7. Se uma grelha inteira ficar vazia, esconde o seu título (H2)
      const tituloGrelha = grid.previousElementSibling;
      if (tituloGrelha && tituloGrelha.tagName === 'H2') {
        if (cartoesVisiveisNestaGrelha === 0) {
          tituloGrelha.style.display = 'none';
        } else {
          tituloGrelha.style.display = 'block';
        }
      }

      totalVisivel += cartoesVisiveisNestaGrelha;
    });

    // 8. (Opcional) Mostra uma mensagem se NENHUM cartão for encontrado
    // Pode criar um <div id="filtro-sem-resultados" class="hidden">...</div>
    const msgSemResultados = document.getElementById('filtro-sem-resultados');
    if (msgSemResultados) {
      if (totalVisivel === 0) {
        msgSemResultados.style.display = 'block';
      } else {
        msgSemResultados.style.display = 'none';
      }
    }
  }

  // 9. "Ouve" o evento de digitação no input
  input.addEventListener('input', filtrarCartoes);
}

// Garante que o script só corre depois de a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFiltroIndex);
} else {
  inicializarFiltroIndex(); // Corre imediatamente se o DOM já estiver carregado
}