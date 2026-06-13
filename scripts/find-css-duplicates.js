#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const cssArg = process.argv[2] || "global-styles.css";
const cssPath = path.resolve(cssArg);
if (!fs.existsSync(cssPath)) {
  console.error("Arquivo não encontrado:", cssPath);
  process.exit(1);
}
const content = fs.readFileSync(cssPath, "utf8");

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "");
}
function normWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

const blocks = [];
let idx = 0;
let last = 0;
while (idx < content.length) {
  const open = content.indexOf("{", idx);
  if (open === -1) break;
  // find matching close
  let j = open + 1;
  let depth = 1;
  while (j < content.length && depth > 0) {
    if (content[j] === "{") depth++;
    else if (content[j] === "}") depth--;
    j++;
  }
  if (depth !== 0) break;
  const selectorText = content.slice(last, open).trim();
  const blockText = content.slice(last, j);
  const startLine = content.slice(0, last).split("\n").length;
  const endLine = content.slice(0, j).split("\n").length;
  blocks.push({
    selector: normWhitespace(selectorText),
    text: blockText,
    startLine,
    endLine,
  });
  last = j;
  idx = j;
}

// Analyze blocks
const contentMap = new Map();
const selectorMap = new Map();

for (const b of blocks) {
  const noComments = stripComments(b.text);
  const normalizedContent = normWhitespace(noComments);
  if (!contentMap.has(normalizedContent)) contentMap.set(normalizedContent, []);
  contentMap.get(normalizedContent).push(b);

  const selKey = b.selector || "(anonymous)";
  if (!selectorMap.has(selKey)) selectorMap.set(selKey, []);

  // Try extract flat properties if no nested braces inside first-level
  const firstOpen = b.text.indexOf("{");
  const lastClose = b.text.lastIndexOf("}");
  let propsKey = null;
  const inner = b.text.slice(firstOpen + 1, lastClose);
  if (inner.indexOf("{") === -1) {
    // parse properties
    const cleanInner = stripComments(inner);
    const parts = cleanInner
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean);
    const props = {};
    for (const p of parts) {
      const idxColon = p.indexOf(":");
      if (idxColon === -1) continue;
      const name = p.slice(0, idxColon).trim().toLowerCase();
      const value = p.slice(idxColon + 1).trim();
      props[name] = value;
    }
    const keys = Object.keys(props).sort();
    propsKey = keys.map((k) => k + ":" + props[k]).join(";");
  }
  selectorMap.get(selKey).push({ ...b, propsKey });
}

// Collect exact duplicate blocks (same normalized content)
const exactDuplicates = [];
for (const [k, arr] of contentMap.entries()) {
  if (arr.length > 1) {
    exactDuplicates.push({
      count: arr.length,
      sample: k.slice(0, 200),
      occurrences: arr.map((x) => ({
        selector: x.selector,
        startLine: x.startLine,
        endLine: x.endLine,
      })),
    });
  }
}

// Collect repeated selectors with different props
const selectorConflicts = [];
for (const [sel, arr] of selectorMap.entries()) {
  if (arr.length > 1) {
    const propsSet = new Set(arr.map((a) => a.propsKey || "(nested-or-none)"));
    if (propsSet.size > 1) {
      selectorConflicts.push({
        selector: sel,
        occurrences: arr.map((a) => ({
          startLine: a.startLine,
          endLine: a.endLine,
          propsKey: a.propsKey,
        })),
      });
    } else if (propsSet.size === 1 && arr.length > 1) {
      // same props but duplicated selector
      selectorConflicts.push({
        selector: sel,
        occurrences: arr.map((a) => ({
          startLine: a.startLine,
          endLine: a.endLine,
          propsKey: a.propsKey,
        })),
        note: "mesmas propriedades (duplicado exato para este seletor)",
      });
    }
  }
}

const report = {
  file: cssPath,
  totalBlocks: blocks.length,
  exactDuplicatesCount: exactDuplicates.length,
  exactDuplicates,
  selectorConflictsCount: selectorConflicts.length,
  selectorConflicts,
};

const outPath = path.resolve("css-duplicates-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log("Relatório salvo em", outPath);
console.log(
  "Resumo: ",
  report.totalBlocks,
  "blocos,",
  report.exactDuplicatesCount,
  "duplicatas exatas,",
  report.selectorConflictsCount,
  "conflitos de seletor.",
);

// Also print short summary to stdout
if (exactDuplicates.length) {
  console.log("\nDuplicatas exatas (amostra):");
  exactDuplicates.slice(0, 20).forEach((d) => {
    console.log(
      "-",
      d.count,
      "ocorrências. Exemplos linhas:",
      d.occurrences
        .map((o) => o.startLine + "-" + o.endLine)
        .slice(0, 5)
        .join(", "),
    );
  });
}
if (selectorConflicts.length) {
  console.log("\nSeletor duplicado/colisao (exemplos):");
  selectorConflicts.slice(0, 20).forEach((s) => {
    console.log(
      "-",
      s.selector,
      "linhas:",
      s.occurrences.map((o) => o.startLine + "-" + o.endLine).join(", "),
    );
  });
}

process.exit(0);
