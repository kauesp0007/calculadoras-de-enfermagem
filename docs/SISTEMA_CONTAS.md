# SISTEMA DE CONTAS — Documentação Oficial

**Versão:** 1.0 — Fase 1  
**Projeto:** Calculadoras de Enfermagem  
**Tecnologia:** Firebase Authentication (Web SDK v10)

---

## 1. Estrutura Criada

```
calculadoras-de-enfermagem/
├── conta/                              ← Sistema de contas (páginas)
│   ├── login.html                      ← Página de login (FUNCIONAL)
│   ├── perfil.html                     ← Placeholder — Meu Perfil
│   ├── configuracoes.html              ← Placeholder — Configurações
│   ├── historico.html                  ← Placeholder — Histórico
│   ├── favoritos.html                  ← Placeholder — Favoritos
│   └── assinatura.html                 ← Placeholder — Assinatura Premium
│
├── js/
│   ├── firebase/                       ← Configuração do Firebase
│   │   └── firebase-init.js            ← Inicialização lazy do SDK
│   │
│   └── auth/                           ← Módulos de autenticação
│       ├── auth-core.js                ← API pública (FACADE)
│       ├── auth-session.js             ← Persistência de sessão
│       ├── auth-providers.js           ← Fábrica de provedores
│       ├── auth-google.js              ← Google Sign-In (FUNCIONAL)
│       ├── auth-microsoft.js           ← Microsoft (placeholder)
│       ├── auth-apple.js               ← Apple (placeholder)
│       ├── auth-email.js               ← Email/Senha (FUNCIONAL)
│       ├── auth-permissions.js         ← Controle de acesso
│       ├── auth-user-profile.js        ← Perfil do usuário
│       └── auth-ui.js                  ← Bindings de UI
│
└── DOCS/
    └── SISTEMA_CONTAS.md               ← Este documento
```

---

## 2. Responsabilidade de Cada Arquivo

### 2.1 Páginas HTML

| Arquivo | Status | Descrição |
|---|---|---|
| `conta/login.html` | ✅ Funcional | Login com Google + Email/Senha. Segue template `fugulin.html`. |
| `conta/perfil.html` | 🔜 Futuro | Edição de nome, foto, idioma, país. |
| `conta/configuracoes.html` | 🔜 Futuro | Notificações, privacidade, exclusão de conta. |
| `conta/historico.html` | 🔜 Futuro | Histórico de cálculos e laudos gerados. |
| `conta/favoritos.html` | 🔜 Futuro | Calculadoras e escalas favoritas. |
| `conta/assinatura.html` | 🔜 Futuro | Planos e pagamentos. |

### 2.2 Módulos JavaScript

| Arquivo | Camada | Descrição |
|---|---|---|
| `firebase-init.js` | Infraestrutura | Carrega o SDK Firebase sob demanda. Singleton. |
| `auth-core.js` | API Pública | `Auth.isLoggedIn()`, `Auth.signIn()`, `Auth.signOut()` |
| `auth-session.js` | Sessão | Cache local, persistência, restauração. |
| `auth-providers.js` | Fábrica | Registra e recupera provedores de login. |
| `auth-google.js` | Provedor | Login com popup do Google. |
| `auth-email.js` | Provedor | Login, registro e recuperação por email/senha. |
| `auth-microsoft.js` | Provedor | Estrutura preparada — implementar futuramente. |
| `auth-apple.js` | Provedor | Estrutura preparada — implementar futuramente. |
| `auth-permissions.js` | Negócio | Verifica plano e permissões do usuário. |
| `auth-user-profile.js` | Dados | CRUD do perfil no Firestore. |
| `auth-ui.js` | Interface | Conecta botões/formulários aos módulos. |

---

## 3. Fluxo Completo do Login

### 3.1 Login com Google (implementado)

```
1. Usuário acessa /conta/login.html
2. auth-ui.js inicializa e verifica sessão existente
3. Usuário clica em "Continuar com Google"
4. auth-ui.js chama Auth.signIn("google")
5. auth-core.js delega para auth-google.js
6. auth-google.js chama firebase.auth().signInWithPopup()
7. Google abre popup → usuário seleciona conta
8. Firebase retorna UserCredential
9. auth-session.js persiste perfil no localStorage
10. Usuário é redirecionado para home (/)
```

### 3.2 Login com Email/Senha (implementado)

```
1. Usuário preenche email e senha
2. Clica em "Entrar"
3. auth-ui.js valida campos
4. Chama Auth.signIn("email", { mode: "login", email, password })
5. auth-email.js chama firebase.auth().signInWithEmailAndPassword()
6. Firebase valida credenciais
7. Sessão persistida automaticamente
8. Redirecionamento para home
```

### 3.3 Criar Conta (implementado)

```
1. Usuário clica em "Criar conta"
2. Formulário exibe campo adicional "Nome completo"
3. Usuário preenche nome, email e senha
4. auth-email.js chama createUserWithEmailAndPassword()
5. Perfil atualizado com displayName
6. Documento criado no Firestore (coleção "users")
7. Usuário logado e redirecionado
```

### 3.4 Recuperar Senha (implementado)

```
1. Usuário clica em "Esqueceu a senha?"
2. Informa o email cadastrado
3. auth-email.js chama sendPasswordResetEmail()
4. Firebase envia email com link de redefinição
5. Usuário clica no link → define nova senha
6. Redirecionado de volta ao login
```

---

## 4. Como Adicionar Novos Provedores de Autenticação

### Passo a passo para adicionar um novo provedor (ex: GitHub)

1. **Crie o arquivo** `js/auth/auth-github.js`:

```js
(function (window) {
  "use strict";

  async function signIn(options) {
    var auth = window.FirebaseInit.getAuthSync();
    var provider = new window.firebase.auth.GithubAuthProvider();
    provider.addScope("user:email");
    return auth.signInWithPopup(provider);
  }

  function isAvailable() {
    return true;
  }

  // Registra na fábrica
  window.AuthModules.providers.register("github", {
    signIn: signIn,
    isAvailable: isAvailable
  });

  window.AuthModules.github = {
    signIn: signIn,
    isAvailable: isAvailable
  };
})(window);
```

2. **Adicione o script** na página `login.html`:

```html
<script src="/js/auth/auth-github.js"></script>
```

3. **Adicione o botão** no HTML de login:

```html
<button id="btn-github-login" class="social-btn auth-btn">
  <!-- Ícone do GitHub -->
  Continuar com GitHub
</button>
```

4. **Adicione o listener** no `auth-ui.js` ou no inline script:

```js
document.getElementById("btn-github-login").addEventListener("click", function(e) {
  e.preventDefault();
  _handleSocialLogin("github");
});
```

5. **Habilite no Console Firebase:**
   - Authentication → Sign-in method → GitHub → Habilitar
   - Preencher Client ID e Client Secret do GitHub OAuth App

6. **Pronto.** Nenhum outro arquivo precisa ser alterado.

---

## 5. Como Proteger Páginas Premium (Futuro)

### Em qualquer página HTML:

```html
<!-- Carrega os módulos necessários -->
<script src="/js/firebase/firebase-init.js"></script>
<script src="/js/auth/auth-core.js"></script>

<script>
  (async function() {
    // Inicializa o sistema de autenticação
    await Auth.init();

    // Verifica se está logado
    if (!Auth.isLoggedIn()) {
      // Redireciona para login com URL de retorno
      var returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = "/conta/login.html?returnUrl=" + returnUrl;
      return;
    }

    // Verifica se tem plano premium
    if (!Auth.hasPlan("premium")) {
      // Redireciona para página de assinatura
      window.location.href = "/conta/assinatura.html";
      return;
    }

    // Usuário autenticado e premium — carrega o conteúdo
    console.log("Bem-vindo, " + Auth.currentUser().displayName);
  })();
</script>
```

### Verificações disponíveis:

```js
// Sessão
Auth.isLoggedIn()              // true/false
Auth.currentUser()             // Objeto Firebase User ou null

// Plano
Auth.hasPlan("free")           // Usuário gratuito?
Auth.hasPlan("premium")        // Qualquer plano premium?
Auth.hasPlan("premium_monthly") // Plano mensal?
Auth.hasPlan("premium_annual")  // Plano anual?

// Permissões
Auth.hasPermission("canAccessPremium")  // Acesso a conteúdo premium?
Auth.hasPermission("canDownload")       // Pode baixar materiais?
Auth.hasPermission("canViewCertificates") // Pode ver certificados?

// Admin
AuthModules.permissions.isAdmin()  // É administrador?
```

---

## 6. Como Verificar se um Usuário Está Autenticado

### Método 1: Verificação síncrona (rápida, sem rede)

```js
if (Auth.isLoggedIn()) {
  var user = Auth.currentUser();
  console.log("Logado como:", user.email);
}
```

### Método 2: Listener de mudanças de estado

```js
Auth.onAuthChange(function(user) {
  if (user) {
    console.log("Usuário logou:", user.email);
    // Atualiza UI: mostra avatar, menu do usuário
  } else {
    console.log("Usuário deslogou");
    // Atualiza UI: mostra botão "Entrar"
  }
});
```

### Método 3: Aguardar inicialização (assíncrono)

```js
Auth.init().then(function() {
  if (Auth.isLoggedIn()) {
    // Usuário está logado
  }
});
```

---

## 7. Como Verificar Permissões

```js
// Verificação simples de plano
if (Auth.hasPlan("premium")) {
  mostrarConteudoPremium();
}

// Verificação granular de permissão
if (Auth.hasPermission("canDownload")) {
  mostrarBotaoDownload();
}

// Verificação de admin
if (AuthModules.permissions.isAdmin()) {
  mostrarPainelAdmin();
}

// Verificação de expiração do plano
if (AuthModules.permissions.isPlanExpired()) {
  mostrarAvisoRenovacao();
}
```

---

## 8. Como Reutilizar o Sistema em Qualquer Página

### Passo 1: Adicionar os scripts necessários

```html
<script src="/js/firebase/firebase-init.js"></script>
<script src="/js/auth/auth-core.js"></script>
<script src="/js/auth/auth-session.js"></script>
<script src="/js/auth/auth-permissions.js"></script>
```

### Passo 2: Inicializar e verificar

```html
<script>
  (async function() {
    await Auth.init();

    if (Auth.isLoggedIn()) {
      var user = Auth.currentUser();
      // Exibe informações do usuário
      console.log("Usuário:", user.displayName);
    }
  })();
</script>
```

### Passo 3 (opcional): Reagir a mudanças de auth

```html
<script>
  Auth.onAuthChange(function(user) {
    var loginBtn = document.getElementById("btn-login");
    var avatarEl = document.getElementById("user-avatar");

    if (user) {
      loginBtn.style.display = "none";
      avatarEl.style.display = "block";
      avatarEl.querySelector("img").src = user.photoURL || "/img/default-avatar.webp";
    } else {
      loginBtn.style.display = "block";
      avatarEl.style.display = "none";
    }
  });
</script>
```

---

## 9. Configuração do Firebase (para referência)

### Projeto criado:
- **Nome:** calculadoras-enfermagem
- **Auth Domain:** calculadoras-enfermagem.firebaseapp.com
- **Project ID:** calculadoras-enfermagem

### Provedores habilitados no Console Firebase:
1. ✅ **Google** — Authentication → Sign-in method → Google → Habilitar
2. ✅ **Email/Senha** — Authentication → Sign-in method → Email/Senha → Habilitar
3. 🔜 **Microsoft** — (futuro)
4. 🔜 **Apple** — (futuro)

### Domínios autorizados (Firebase Console → Authentication → Settings → Authorized domains):
- `calculadorasdeenfermagem.com.br`
- `localhost` (para desenvolvimento local)
- `127.0.0.1` (para desenvolvimento local)

### Firestore Database (Console → Firestore → Criar banco de dados):
- Modo: Produção (bloqueado por padrão)
- Região: southamerica-east1 (São Paulo)
- Coleção: `users`

### Regras de segurança do Firestore (recomendadas):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem ler/escrever seu próprio documento
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Nunca permitir exclusão via client
    }

    // Conteúdo premium: apenas leitura para usuários premium
    match /premium-content/{docId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.plan != 'free';
      allow write: if false;
    }
  }
}
```

---

## 10. Estrutura do Documento Firestore

### Coleção: `users`
### Documento: `{uid}` (UID do Firebase Auth)

```json
{
  "uid": "abc123...",
  "email": "usuario@email.com",
  "displayName": "Nome do Usuário",
  "photoURL": "https://...",
  "language": "pt",
  "country": "BR",
  "createdAt": "2026-08-04T12:00:00Z",
  "lastLoginAt": "2026-08-04T15:30:00Z",
  "accountType": "google",
  "status": "active",
  "plan": "free",
  "planExpiresAt": null,
  "permissions": {
    "canAccessPremium": false,
    "canDownload": false,
    "canViewCertificates": false,
    "canSaveFavorites": true,
    "canViewHistory": true,
    "role": "user"
  }
}
```

---

## 11. Guia Rápido de Manutenção

### Onde alterar a config do Firebase?
→ `js/firebase/firebase-init.js` (objeto `firebaseConfig`)

### Onde adicionar novo provedor?
→ Criar `js/auth/auth-{nome}.js` seguindo a interface de `auth-providers.js`
→ Registrar com `AuthModules.providers.register("nome", modulo)`

### Onde alterar a página de login?
→ `conta/login.html` (HTML/CSS)
→ `js/auth/auth-ui.js` (lógica de UI)

### Onde alterar as regras de permissão?
→ `js/auth/auth-permissions.js` (mapa `PLAN_PERMISSIONS`)

### Onde alterar a estrutura do perfil?
→ `js/auth/auth-user-profile.js`

---

## 12. Checklist de Segurança

- [x] Senhas nunca armazenadas (Firebase Auth gerencia hash)
- [x] Tokens nunca expostos em HTML
- [x] Chaves de API são públicas (Firebase Web SDK — normal)
- [x] Segurança real nas regras do Firestore
- [x] Domínios autorizados limitados no Console Firebase
- [x] `noindex` nas páginas de conta (não indexar login no Google)
- [x] Sessão persistida via Firebase Auth (IndexedDB, seguro)
- [x] Cache local só armazena dados não-sensiveis
- [x] URL de retorno validada (apenas caminhos relativos)

---

**Fim da Documentação — Fase 1 concluída.**
