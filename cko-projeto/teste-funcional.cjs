#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const puppeteer = require("puppeteer");

const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function staticServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const target = path.resolve(ROOT, "." + pathname);
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    fs.stat(target, (statError, stat) => {
      if (statError || !stat.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.setHeader("Content-Type", MIME[path.extname(target)] || "application/octet-stream");
      response.setHeader("Cache-Control", "no-store");
      fs.createReadStream(target).pipe(response);
    });
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address().port;
}

async function main() {
  const server = staticServer();
  const port = await listen(server);
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const consoleErrors = [];
    const requestFailures = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => requestFailures.push(request.url()));

    const base = `http://127.0.0.1:${port}`;
    await page.goto(`${base}/03-templates/paginas/index.html`, { waitUntil: "networkidle0" });
    const cardCount = await page.$$eval(".library-card", (cards) => cards.length);
    const firstHref = await page.$eval(".library-card", (card) => card.getAttribute("href"));
    await page.goto(`${base}/03-templates/paginas/${firstHref}`, { waitUntil: "networkidle0" });

    const title = await page.$eval("h1", (element) => element.textContent.trim());
    await page.click('[data-tab="seguranca"]');
    const safetyVisible = await page.$eval("#tab-seguranca", (panel) => !panel.hidden);
    await page.focus('[data-tab="seguranca"]');
    await page.keyboard.press("ArrowRight");
    const keyboardTab = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-tab"));
    await page.click('[data-action="favorite"]');
    const favoriteState = await page.$eval('[data-action="favorite"]', (button) => button.getAttribute("aria-pressed"));
    await page.goto(`${base}/03-templates/seringa-10ml.html`, { waitUntil: "networkidle0" });
    const aliasPath = new URL(page.url()).pathname;

    const assertions = {
      "índice lista 17 bibliotecas": cardCount === 17,
      "página possui título": Boolean(title),
      "aba Segurança abre": safetyVisible,
      "teclado muda para a próxima aba": keyboardTab === "processo",
      "favorito muda de estado": favoriteState === "true",
      "alias antigo redireciona": aliasPath.endsWith("/paginas/seringa-10ml-luerlock.html"),
      "sem erros no console": consoleErrors.length === 0,
      "sem requisições falhas": requestFailures.length === 0,
    };

    console.log("== Teste funcional CKO ==");
    for (const [name, passed] of Object.entries(assertions)) {
      console.log(`  ${passed ? "OK" : "FALHA"} — ${name}`);
    }
    if (consoleErrors.length) console.log("Erros de console:", consoleErrors);
    if (requestFailures.length) console.log("Requisições falhas:", requestFailures);
    if (Object.values(assertions).some((passed) => !passed)) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
