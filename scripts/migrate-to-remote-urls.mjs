import fs from 'node:fs';

const ALBUMS_PATH = 'src/data/albums.json';
const BACKUP_PATH = 'src/data/albums.json.bak';

const albums = JSON.parse(fs.readFileSync(ALBUMS_PATH, 'utf-8'));
fs.writeFileSync(BACKUP_PATH, JSON.stringify(albums, null, 2), 'utf-8');
console.log(`Backed up original albums.json to ${BACKUP_PATH}`);

const keyImages = JSON.parse(fs.readFileSync('scripts/resolved_key_images.json', 'utf-8'));
const r3 = JSON.parse(fs.readFileSync('scripts/resolved_album3.json', 'utf-8'));
const r3Items = Object.values(r3).sort((a, b) => a.index - b.index);

// Album 1 (Debut)
albums[0].coverImage = keyImages.cover_album1.directUrl;
console.log(`Album 1 cover updated to remote URL: ${albums[0].coverImage}`);

// Album 2 (Greek Goddess)
albums[1].coverImage = keyImages.cover_album2.directUrl;
console.log(`Album 2 cover updated to remote URL: ${albums[1].coverImage}`);

// Album 3 (Green Saree)
const cover3 = r3Items.find(it => it.pageUrl.includes('130313020') || it.directUrl.includes('44.png'));
albums[2].coverImage = cover3.directUrl;
console.log(`Album 3 cover updated to remote URL: ${albums[2].coverImage}`);

// Update Album 3 photos to remote URLs
if (albums[2].photographs.length !== r3Items.length) {
  throw new Error(`Album 3 photo count mismatch: ${albums[2].photographs.length} vs ${r3Items.length}`);
}

albums[2].photographs = albums[2].photographs.map((photo, idx) => {
  const resolved = r3Items[idx];
  return {
    ...photo,
    src: resolved.directUrl,
    thumbSrc: resolved.thumbUrl
  };
});

console.log(`Album 3: all ${albums[2].photographs.length} photographs migrated to remote direct CDN URLs.`);

// Save updated albums.json
fs.writeFileSync(ALBUMS_PATH, JSON.stringify(albums, null, 2), 'utf-8');
console.log(`Successfully updated ${ALBUMS_PATH}!`);

// Audit for any remaining local album asset paths
let localRefs = 0;
albums.forEach(album => {
  if (album.coverImage.startsWith('/images/albums/')) localRefs++;
  album.photographs.forEach(p => {
    if (p.src.startsWith('/images/albums/')) localRefs++;
    if (p.thumbSrc?.startsWith('/images/albums/')) localRefs++;
  });
});

console.log('='.repeat(70));
console.log(`MIGRATION SUMMARY:`);
console.log(`- Albums Count: ${albums.length}`);
console.log(`- Album 1 Photo Count: ${albums[0].photographs.length}`);
console.log(`- Album 2 Photo Count: ${albums[1].photographs.length}`);
console.log(`- Album 3 Photo Count: ${albums[2].photographs.length}`);
console.log(`- Remaining local album asset references: ${localRefs}`);
console.log('='.repeat(70));
