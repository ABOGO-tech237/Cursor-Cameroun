/* eslint-disable @typescript-eslint/no-require-imports -- script CommonJS */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const galleryDir = path.join(process.cwd(), "public/gallery");
const files = fs.readdirSync(galleryDir).filter(f => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg"));

(async () => {
  let converted = 0;
  for (const file of files) {
    const src = path.join(galleryDir, file);
    const base = file.replace(/\.(png|jpg|jpeg)$/i, "");
    const avifDest = path.join(galleryDir, base + ".avif");
    const webpDest = path.join(galleryDir, base + ".webp");

    try {
      await sharp(src).avif({ quality: 75 }).toFile(avifDest);
      await sharp(src).webp({ quality: 82 }).toFile(webpDest);
      const origSize = fs.statSync(src).size;
      const avifSize = fs.statSync(avifDest).size;
      const webpSize = fs.statSync(webpDest).size;
      console.log(`✅ ${file} → avif: ${Math.round(avifSize/1024)}KB | webp: ${Math.round(webpSize/1024)}KB (was ${Math.round(origSize/1024)}KB)`);
      converted++;
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
  console.log(`\nDone: ${converted}/${files.length} files converted.`);
})();
