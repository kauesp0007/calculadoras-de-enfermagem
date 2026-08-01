# CHECKLIST OFICIAL DO PROJETO

Versão: 1.0

Este documento define a revisão obrigatória antes de qualquer código ser considerado concluído.

Nenhuma tarefa deverá ser finalizada sem passar por este checklist.

---

# CHECKLIST GERAL

Antes de responder qualquer solicitação:

☐ Ler PROMPT_MASTER.md

☐ Ler ARQUITETURA.md

☐ Ler RULES.md

☐ Ler ROADMAP.md

☐ Ler TODO.md

☐ Ler os padrões relacionados ao assunto.

---

# ANTES DE ESCREVER CÓDIGO

☐ Entendi exatamente o que o usuário pediu.

☐ Verifiquei se já existe implementação semelhante.

☐ Verifiquei se existe função reutilizável.

☐ Não vou duplicar código.

☐ Não vou alterar arquitetura.

---

# ANTES DE CRIAR ARQUIVOS

☐ O arquivo realmente é necessário.

☐ Não existe outro arquivo com a mesma responsabilidade.

☐ O nome segue o padrão snake_case.

☐ O local do arquivo segue ESTRUTURA_PROJETO.md.

---

# ANTES DE MODIFICAR ARQUIVOS

☐ Li o arquivo inteiro.

☐ Entendi sua responsabilidade.

☐ Verifiquei dependências.

☐ Não vou quebrar compatibilidade.

☐ Vou preservar funcionalidades existentes.

---

# QUALIDADE DO CÓDIGO

☐ Código limpo.

☐ Código legível.

☐ Código modular.

☐ Código reutilizável.

☐ Sem duplicação.

☐ Sem números mágicos.

☐ Constantes em config.py.

☐ Imports organizados.

☐ Funções pequenas.

☐ Uma função = uma responsabilidade.

---

# OPENCV

☐ Apenas processamento de imagem.

☐ Não contém lógica de IA.

☐ Não contém HTML.

☐ Não contém regras de negócio.

☐ Apenas detecta, recorta e salva.

---

# OPENAI

☐ Apenas classifica.

☐ Apenas categoriza.

☐ Apenas descreve.

☐ Responde em JSON.

☐ Não faz processamento gráfico.

☐ Resposta validada antes de usar.

---

# PYTHON

☐ Tipagem utilizada quando possível.

☐ Tratamento de exceções.

☐ Logs claros.

☐ main() presente quando necessário.

☐ pathlib utilizado.

☐ Caminhos absolutos não utilizados.

---

# JSON

☐ JSON válido.

☐ UTF-8.

☐ indent=4.

☐ ensure_ascii=False.

☐ Estrutura validada.

---

# WEBP

☐ Qualidade correta.

☐ Transparência preservada quando aplicável.

☐ Arquivo otimizado.

---

# HTML

☐ HTML5.

☐ Semântico.

☐ Apenas um H1.

☐ SEO completo.

☐ Acessível.

☐ Responsivo.

☐ Sem CSS inline.

☐ Sem JavaScript inline.

---

# PERFORMANCE

☐ Não há processamento duplicado.

☐ Não há chamadas desnecessárias da OpenAI.

☐ Cache utilizado quando possível.

☐ Memória utilizada corretamente.

---

# SEGURANÇA

☐ API Key protegida.

☐ Utiliza .env.

☐ Não altera .gitignore.

☐ Não grava credenciais em logs.

---

# LOGS

☐ Etapas identificadas.

☐ Erros informativos.

☐ Mensagens claras.

---

# TESTES

☐ Arquivo executado.

☐ Sem erros.

☐ Resultado validado.

☐ Arquivos gerados corretamente.

---

# DOCUMENTAÇÃO

☐ Comentários apenas quando necessários.

☐ Código fácil de entender.

☐ Mantém padrão do projeto.

---

# ANTES DE RESPONDER AO USUÁRIO

☐ Arquivos completos.

☐ Não enviar apenas trechos.

☐ Não pedir para editar linhas isoladas.

☐ Responder objetivamente.

☐ Continuar exatamente da etapa atual.

☐ Não mudar a arquitetura do projeto.

---

# REGRA FINAL

Uma tarefa somente poderá ser considerada concluída quando TODOS os itens deste checklist estiverem atendidos.

Caso algum item não seja atendido:

A tarefa deverá permanecer como "Em desenvolvimento".

Nunca considerar código incompleto como concluído.