// Convertit les images de originaux/ en WebP légers dans assets/photos/
//   - petites images (portraits) : 320 px max      -> nom.webp
//   - grandes images (illustrations) : 1600 px max -> nom.webp  + miniature 640 px -> nom-m.webp
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'originaux');
const OUT = path.join(__dirname, '..', 'assets', 'photos');

const slug = (s) => s.replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ - PNJ$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(SRC).filter((n) => /\.(png|jpe?g|webp)$/i.test(n))) {
        const nom = slug(f);
        const taille = fs.statSync(path.join(SRC, f)).size;
        const grande = taille > 100 * 1024;
        const img = () => sharp(path.join(SRC, f));
        if (grande) {
            await img().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(OUT, nom + '.webp'));
            await img().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(OUT, nom + '-m.webp'));
        } else {
            // pixel art : on garde les pixels nets
            await img().resize({ width: 320, height: 320, fit: 'inside', kernel: 'nearest', withoutEnlargement: false }).webp({ quality: 90, nearLossless: true }).toFile(path.join(OUT, nom + '.webp'));
            fs.copyFileSync(path.join(OUT, nom + '.webp'), path.join(OUT, nom + '-m.webp'));
        }
        console.log((grande ? 'illustration ' : 'portrait     ') + f + '  ->  ' + nom + '.webp');
    }
})();
