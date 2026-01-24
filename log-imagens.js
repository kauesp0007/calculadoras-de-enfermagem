const fs = require("fs");
const path = require("path");

const IMG_DIR = path.join(__dirname, "img");
const LOG_FILE = path.join(__dirname, "img-log.txt");

if (!fs.existsSync(IMG_DIR)) process.exit(0);

const files = fs.readdirSync(IMG_DIR)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

if (!files.length) process.exit(0);

const now = new Date().toLocaleString("pt-BR");

let content = "\n";
files.forEach(f => content += f + "\n");
content += `\nAdicionado em: ${now}\n`;
content += "--------------------------------------------------\n";

fs.appendFileSync(LOG_FILE, content);
