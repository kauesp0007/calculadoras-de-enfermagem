# Templates LinkedIn/Instagram - Enfermagem

Sistema completo de templates editáveis para posts profissionais de enfermagem, otimizados para LinkedIn (1:1) e adaptáveis para Instagram.

## 📋 Características

- **Formato 1:1**: Otimizado para LinkedIn e Instagram
- **Totalmente Editável**: Textos, imagens e cores podem ser alterados
- **Responsivo**: Adapta-se automaticamente a diferentes tamanhos de tela
- **Exportação PNG**: Gere imagens em alta qualidade
- **Fontes Profissionais**: Nunito Sans (títulos) e Inter (textos)
- **Cor Primária**: #1a3e74 (azul institucional)

## 🎨 Templates Disponíveis

### 1. Quiz Educativo (`quiz.html`)
- Template para quizzes interativos
- Múltiplas opções de resposta
- Ideal para testar conhecimentos

### 2. Institucional (`institucional.html`)
- Posts institucionais
- Apresentação de serviços
- Informações sobre clínicas/hospitais

### 3. Educativo (`educativo.html`)
- Conteúdo educativo com dicas
- Procedimentos passo a passo
- Conhecimentos técnicos

### 4. Comemorativo (`comemorativo.html`)
- Datas especiais (Dia do Enfermeiro, etc.)
- Outubro Rosa
- Campanhas de saúde

### 5. Múltiplas Imagens (`multiplas-imagens.html`)
- Galeria com até 6 imagens
- Procedimentos visuais
- Antes/depois

### 6. Lista de Tópicos (`topicos.html`)
- Listas numeradas
- Dicas organizadas
- Informações por tópicos

### 7. Gráficos (`graficos.html`)
- Gráficos editáveis (Chart.js)
- Estatísticas de saúde
- Dados visuais

### 8. Tabelas (`tabelas.html`)
- Tabelas editáveis
- Valores de referência
- Dados organizados

## 🚀 Como Usar

### Navegação
1. Abra `index.html` no navegador
2. Escolha o template desejado
3. Clique em "Usar Template"

### Edição de Conteúdo
- **Textos**: Clique em qualquer texto para editá-lo
- **Imagens**: Clique nas imagens para fazer upload
- **Cores**: Use os controles de cor (quando disponíveis)

### Funcionalidades Especiais
- **Quiz**: Adicione/remova opções de resposta
- **Tópicos**: Adicione novos itens à lista
- **Imagens**: Adicione até 6 imagens com títulos
- **Gráficos**: Altere tipo de gráfico e dados
- **Tabelas**: Adicione linhas e colunas

### Exportação
1. Clique no botão "Exportar como Imagem"
2. A imagem será baixada em formato PNG
3. Resolução otimizada para redes sociais

## 📁 Estrutura de Arquivos

```
linkedin-templates/
├── index.html              # Página principal
├── README.md               # Este arquivo
├── css/
│   └── base.css           # Estilos base
├── js/
│   └── editor.js          # Funcionalidades de edição
├── templates/
│   ├── quiz.html
│   ├── institucional.html
│   ├── educativo.html
│   ├── comemorativo.html
│   ├── multiplas-imagens.html
│   ├── topicos.html
│   ├── graficos.html
│   └── tabelas.html
└── assets/                # Pasta para imagens (vazia)
```

## 🎯 Padrões de Design

### Tipografia
- **Títulos**: Nunito Sans (700, 600)
- **Subtítulos**: Inter (600, 500)
- **Textos**: Inter (400)

### Cores
- **Primária**: #1a3e74
- **Primária Clara**: #2a5a94
- **Primária Escura**: #0f2a54
- **Texto**: #2c2c2c
- **Cinza Claro**: #f5f5f5
- **Cinza Médio**: #cccccc

### Dimensões
- **Container**: 500x500px (1:1)
- **Border Radius**: 12px
- **Sombras**: 0 4px 20px rgba(26, 62, 116, 0.15)

## 🔧 Dependências

### Bibliotecas Externas
- **html2canvas**: Para exportação de imagens
- **Chart.js**: Para gráficos (apenas no template de gráficos)
- **Google Fonts**: Nunito Sans e Inter

### Navegadores Suportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📱 Responsividade

Os templates se adaptam automaticamente para:
- **Desktop**: 500x500px
- **Mobile**: 90vw (máximo 400x400px)
- **Fontes**: Reduzem proporcionalmente

## ⚡ Funcionalidades JavaScript

### Editor Base (`editor.js`)
- Edição inline de textos
- Upload de imagens
- Seletor de cores
- Exportação PNG
- Elementos dinâmicos

### Funcionalidades Específicas
- **Quiz**: Adicionar/remover opções
- **Institucional**: Adicionar serviços
- **Educativo**: Adicionar passos
- **Comemorativo**: Alterar datas
- **Imagens**: Gerenciar galeria
- **Tópicos**: Adicionar itens
- **Gráficos**: Editar dados
- **Tabelas**: Adicionar linhas/colunas

## 🎨 Personalização

### Alterando Cores
1. Edite as variáveis CSS em `base.css`
2. Modifique `--primary-color` para sua cor institucional
3. Ajuste cores complementares conforme necessário

### Adicionando Novos Templates
1. Crie novo arquivo HTML em `templates/`
2. Use a estrutura base dos templates existentes
3. Adicione link no `index.html`
4. Implemente funcionalidades específicas

### Modificando Fontes
1. Altere imports no `base.css`
2. Atualize `font-family` nas classes
3. Teste compatibilidade em diferentes dispositivos

## 📄 Licença

Este projeto foi desenvolvido para uso profissional em enfermagem. Livre para uso e modificação.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se todas as dependências estão carregadas
2. Teste em navegador atualizado
3. Verifique console do navegador para erros
4. Certifique-se de que arquivos CSS e JS estão acessíveis

## 🔄 Atualizações

### Versão 1.0
- 8 templates completos
- Sistema de edição inline
- Exportação PNG
- Responsividade total
- Padrões de enfermagem aplicados

