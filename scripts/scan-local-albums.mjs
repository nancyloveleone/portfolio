/**
 * ============================================================================
 * LOCAL ALBUM SCANNER & MANIFEST SYNCHRONIZER
 * ============================================================================
 * 
 * Usage:
 *   npm run scan:albums
 *   or: node scripts/scan-local-albums.mjs
 * 
 * Purpose:
 *   Allows the client to simply drag & drop image folders into
 *   public/images/albums/[album-folder]/ and have them automatically registered
 *   in the portfolio without touching code or JSON!
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const ALBUMS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'albums.json');
const ALBUMS_DIR = path.join(ROOT_DIR, 'public', 'images', 'albums');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function run() {
  console.log('='.repeat(70));
  console.log('Scanning public/images/albums/ for albums...');

  if (!fs.existsSync(ALBUMS_DIR)) {
    console.error(`Directory not found: ${ALBUMS_DIR}`);
    process.exit(1);
  }

  // Read existing albums to preserve customized titles and captions
  let existingAlbums = [];
  if (fs.existsSync(ALBUMS_JSON_PATH)) {
    try {
      existingAlbums = JSON.parse(fs.readFileSync(ALBUMS_JSON_PATH, 'utf-8'));
    } catch {
      existingAlbums = [];
    }
  }

  const existingMap = new Map(existingAlbums.map((a) => [a.slug, a]));

  const entries = fs.readdirSync(ALBUMS_DIR, { withFileTypes: true });
  const albumDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const updatedAlbums = [];

  for (let i = 0; i < albumDirs.length; i++) {
    const slug = albumDirs[i];
    const albumPath = path.join(ALBUMS_DIR, slug);
    const existing = existingMap.get(slug);

    const files = fs.readdirSync(albumPath).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXTS.has(ext);
    });

    if (files.length === 0) {
      console.warn(`Skipping empty album directory: ${slug}`);
      continue;
    }

    // Determine cover image
    let coverName = files.find((f) => f.toLowerCase().startsWith('cover')) || files[0];
    const coverImage = `/images/albums/${slug}/${coverName}`;

    // Readable title from folder slug
    const defaultTitle = slug
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const title = existing?.title || defaultTitle;
    const category = existing?.category || 'Editorial';
    const year = existing?.year || String(new Date().getFullYear());
    const location = existing?.location || 'Paris & Milan';
    const photographer = existing?.photographer || 'Studio Archive';
    const description =
      existing?.description || `Curated ${category.toLowerCase()} photoshoot collection.`;

    // Map photographs
    const photographs = files.map((file, idx) => {
      const existingPhoto = existing?.photographs?.find(
        (p) => p.src.endsWith(`/${file}`) || p.src === `/images/albums/${slug}/${file}`
      );

      const fileNumber = String(idx + 1).padStart(2, '0');

      return {
        id: `${slug}-${fileNumber}`,
        src: `/images/albums/${slug}/${file}`,
        title: existingPhoto?.title || `${title} — Frame ${fileNumber}`,
        caption: existingPhoto?.caption || `Editorial look from ${title}.`,
        photographer: existingPhoto?.photographer || photographer,
        year: existingPhoto?.year || year,
        location: existingPhoto?.location || location
      };
    });

    const albumRecord = {
      id: existing?.id || `album-${Date.now()}-${i + 1}`,
      slug,
      title,
      category,
      year,
      location,
      photographer,
      description,
      coverImage,
      featured: existing?.featured ?? true,
      sortOrder: existing?.sortOrder ?? i + 1,
      photographs,
      sourceMeta: existing?.sourceMeta || {
        importedFrom: 'Local Directory',
        importDate: new Date().toISOString()
      }
    };

    updatedAlbums.push(albumRecord);
    console.log(`Synced [${slug}]: ${photographs.length} photographs found.`);
  }

  // Write updated albums.json
  fs.writeFileSync(ALBUMS_JSON_PATH, JSON.stringify(updatedAlbums, null, 2), 'utf-8');
  console.log(`\nSuccessfully synced ${updatedAlbums.length} albums to src/data/albums.json!`);
  console.log('='.repeat(70));
}

run();
