function gerarPDF() {
  const original = document.getElementById('pdfContent');
  if (!original) {
    alert('Elemento com id="pdfContent" não encontrado.');
    return;
  }

  const clone = original.cloneNode(true);
  // Limpa margens e padding herdados do Tailwind
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.boxSizing = 'border-box';

  clone.querySelectorAll('button, .no-print, .nao-imprimir').forEach(el => el.remove());

  const wrapper = document.createElement('div');
  wrapper.style.width = '210mm'; // largura exata da página A4
  wrapper.style.minHeight = '297mm'; // altura mínima da página A4
  wrapper.style.margin = '0 auto';
  wrapper.style.padding = '10mm';
  wrapper.style.fontFamily = 'Inter, sans-serif';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.backgroundColor = 'white';



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
      margin: 10,
      filename: 'documento.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,           // boa qualidade, mas não exagerada
        useCORS: true
      },
      jsPDF: {
        unit: 'mm',
        orientation: 'portrait'
        // format omitido → tamanho será automático baseado no conteúdo
      }
    })
    .from(wrapper)
    .save();
}
