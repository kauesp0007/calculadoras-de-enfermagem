const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const imgFolder = path.join(__dirname, "img");

fs.readdirSync(imgFolder).forEach((file) => {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    const input = path.join(imgFolder, file);

    const output = input.replace(ext, ".webp");

    sharp(input)
      .webp({
        quality: 85,
      })
      .toFile(output)
      .then(() => {
        console.log(`WEBP criado: ${output}`);
      });
  }
});
