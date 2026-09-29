import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const languages = ["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"];
const paths = [];

async function collect(directory, nested = false) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  for (const entry of entries) {
    if (nested && entry.isDirectory() && entry.name !== "conta") {
      await collect(path.join(directory, entry.name), true);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const relative = directory ? `${directory}/${entry.name}`.replace(/\\/g, "/") : entry.name;
    const html = await readFile(path.join(root, relative), "utf8");
    if (/<html\b/i.test(html)) paths.push(relative.toLowerCase());
  }
}

await collect("");
for (const language of languages) await collect(language, true);

paths.sort();
const output = JSON.stringify({ paths }, null, 2) + "\n";
const target = path.join(root, "conta/developer-route-catalog.json");
if (process.argv.includes("--check")) {
  if (await readFile(target, "utf8") !== output) throw new Error("Developer route catalog is outdated");
} else {
  await writeFile(target, output);
}
console.log(`Developer route catalog: ${paths.length} HTML pages`);
