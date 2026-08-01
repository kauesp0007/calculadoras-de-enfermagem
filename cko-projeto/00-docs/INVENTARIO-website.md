# Inventário do Website (recuperado)

Reconstrução estrutural da planilha *visão global do site* que produzi anteriormente. **Não recuperei o arquivo binário** (não há acesso a bytes de conversas passadas); esta é a estrutura para regeneração.

## Planilha — visão global

- **30 tipos de página** (9 com criticidade clínica ALTA) × **40 recursos**, com contagem automática por linha e coluna.
- Totais que revelam o desenho: escala clínica exige 28 recursos obrigatórios; calculadora 27; home 6.
- **11 abas**, ~153 fórmulas, zero erros de recálculo.

## Abas

| Aba | Conteúdo |
|---|---|
| Matriz Recursos | 30 tipos de página × 40 recursos (obrigatório/opcional por célula) |
| Validacao | 47 itens auditáveis, dropdown de status, formatação condicional, painel de conformidade |
| Componentes | 38 componentes catalogados |
| Icones | 40 ícones (23 semânticos, exigem rótulo acessível) |
| Head | campos de `<head>` por tipo de página |
| JSON-LD | esquema estruturado por tipo |
| WCAG | 32 critérios WCAG 2.2 |
| CSS/JS | lógica normal da página + recursos: bloqueador de anomalia, bloqueio de número negativo, bloqueio de caractere em campo numérico |
| Frameworks Operacionais | enfermagem por país |
| Frameworks | privacidade de dados, acessibilidade, sustentabilidade digital |
| Referências | padrão de referências bibliográficas + tipos de recurso |

## Ligação com este projeto

Os **40 recursos** desta planilha são as colunas conceituais; as **22 bibliotecas** da `matriz-ferramentas-bibliotecas.xlsx` são o eixo de conteúdo. Juntas formam o grafo Ferramenta → Recurso → Biblioteca. Se você reenviar o binário original, eu reconcilio célula a célula em vez de reconstruir.