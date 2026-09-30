{
  "manifest_version": 3,
  "name": "Escala de Braden - Prevenção de Lesões",
  "short_name": "Braden",
  "version": "0.1.0",
  "description": "Calculadora da Escala de Braden para avaliação de risco de lesão por pressão (LPP).",
  "minimum_chrome_version": "102",
  "incognito": "split",
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "action": {
    "default_title": "Abrir Calculadora de Braden"
  },
  "background": {
    "service_worker": "service-worker.js"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "braden.html"
      ],
      "matches": [
        "https://*/*",
        "http://*/*"
      ]
    }
  ],
  "content_security_policy": {
    "extension_pages": "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; object-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none';"
  }
}