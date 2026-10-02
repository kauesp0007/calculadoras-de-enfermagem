# Correção das prévias do catálogo assistencial espanhol — 02/10/2026

Causa: o documento es/formularios_de_escalas_assistenciais.html em premium_content_pages usava 63 imagens de /img/formularios-previas/en/, embora o registro de download já apontasse para PDFs ES.

Alteração: 63 prévias WebP geradas dos PDFs espanhóis existentes, mapa e gerador reproduzível. Troca do prefixo de prévias no documento privado, dimensões 439×622 e tradução dos textos residuais de navegação/oferta. Registro de download, IDs, PDFs e política de acesso preservados.

Validação: node --check do teste; compilação Python do gerador; teste localizado EN/ES com PDFs reais; 63 WebPs decodificáveis; revisão independente de idioma e correspondência imagem/PDF. O teste passa a rejeitar prévias EN no catálogo privado ES quando executado com acesso ao banco.

Publicação: imagens e testes via GitHub Pages; documento atualizado no Supabase antes da etapa de validação do deploy, pois o teste consulta o banco real; com comparação do conteúdo anterior para não sobrescrever mudanças concorrentes.
Imagens usam versão na URL para evitar cache de respostas antigas/404 na CDN.
