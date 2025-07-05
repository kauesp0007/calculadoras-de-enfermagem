function gerarPDF() {
  const original = document.getElementById('pdfContent');
  if (!original) {
    alert('Elemento com id="pdfContent" não encontrado.');
    return;
  }

  const clone = original.cloneNode(true);
  clone.querySelectorAll('button, .no-print, .nao-imprimir').forEach(el => el.remove());

  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  wrapper.style.fontFamily = 'Inter, sans-serif';

  const etiqueta = document.createElement('div');
  etiqueta.style.width = '100mm';
  etiqueta.style.height = '30mm';
  etiqueta.style.border = '1px solid black';
  etiqueta.style.backgroundColor = 'white';
  etiqueta.style.display = 'flex';
  etiqueta.style.alignItems = 'center';
  etiqueta.style.justifyContent = 'center';
  etiqueta.style.marginBottom = '20px';
  etiqueta.innerText = 'Cole a etiqueta aqui';

  const h1 = clone.querySelector('h1');
  if (h1) {
    const icon = document.createElement('img');
    icon.src = 'iconpages.png';
    icon.alt = 'Ícone';
    icon.style.width = '24px';
    icon.style.height = '24px';
    icon.style.marginRight = '10px';
    h1.style.display = 'flex';
    h1.style.alignItems = 'center';
    h1.insertBefore(icon, h1.firstChild);
  }

  wrapper.appendChild(etiqueta);
  wrapper.appendChild(clone);

  html2pdf()
  .set({
    margin: 10,                // margem em mm — pode aumentar para espaçamento extra
    filename: 'documento.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 3,                // aumenta a resolução — mantém boa qualidade, mas deixa arquivo maior
      scrollY: 0,              // força renderizar a partir do topo da página
      windowWidth: 1200,       // largura da "janela" para capturar o conteúdo; ajuste para o tamanho do layout
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',            // formato A4 padrão; pode trocar para 'letter' se preferir
      orientation: 'portrait'  // retrato; pode ser 'landscape' para paisagem
    }
  })
  .from(wrapper)
  .save();
}
