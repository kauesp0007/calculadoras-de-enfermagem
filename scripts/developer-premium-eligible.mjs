import fs from "node:fs/promises";
import path from "node:path";

const languages = new Set(["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"]);

export async function requestedPremiumPaths(root = process.cwd()) {
  const source = process.env.PREMIUM_REQUESTS_FILE;
  if (!source) return [];
  const requests = JSON.parse(await fs.readFile(source, "utf8"));
  if (!Array.isArray(requests) || requests.length > 200) throw new Error("Invalid Premium activation queue");
  const catalog = JSON.parse(await fs.readFile(path.join(root, "conta/developer-route-catalog.json"), "utf8"));
  const known = new Set(catalog.paths);
  const paths = [];
  for (const request of requests) {
    const rel = request.path;
    const parts = typeof rel === "string" ? rel.split("/") : [];
    if (!(parts.length === 1 || (parts.length === 2 && languages.has(parts[0]))) ||
        !/^[a-z0-9_-]+\.html$/.test(parts.at(-1) || "") || !known.has(rel)) {
      throw new Error("Invalid Premium activation path: " + rel);
    }
    const full = path.join(root, rel);
    if (!(await fs.stat(full)).isFile() || !/<html\b/i.test(await fs.readFile(full, "utf8"))) {
      throw new Error("Premium activation page missing: " + rel);
    }
    paths.push(rel);
  }
  return [...new Set(paths)];
}
