import fs from 'node:fs';

const existingAlbums = JSON.parse(fs.readFileSync('src/data/albums.json', 'utf-8'));

// Verify Album 1 and Album 2 are preserved intact
if (existingAlbums.length < 2) {
  throw new Error('Expected at least 2 existing albums in albums.json');
}

const album1 = existingAlbums[0];
const album2 = existingAlbums[1];

const resolvedA3 = JSON.parse(fs.readFileSync('scripts/resolved_album3.json', 'utf-8'));
const items = Object.values(resolvedA3).sort((a, b) => a.index - b.index);

const album3Photos = items.map((item, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  return {
    id: `green-saree-${num}`,
    src: `/images/albums/nancy-leone-green-saree/${num}.png`,
    thumbSrc: `/images/albums/nancy-leone-green-saree/thumbs/thumb-${num}.png`,
    title: `Nancy Leone in Green Saree — Frame ${num}`,
    caption: `Nancy Leone in Green Saree (Frame ${idx + 1} of 61)`
  };
});

const album3 = {
  id: "album-green-saree",
  slug: "nancy-leone-green-saree",
  title: "Nancy Leone in Green Saree",
  category: "Traditional / Saree",
  description: "Traditional photoshoot collection featuring 61 verified high-resolution photographs.",
  coverImage: "/images/albums/nancy-leone-green-saree/cover.png",
  featured: true,
  sortOrder: 3,
  photographs: album3Photos,
  sourceMeta: {
    importedFrom: "TurboImageHost",
    importDate: new Date().toISOString(),
    originalAlbumUrl: "https://www.turboimagehost.com/album/412621/nancy_leone_gs",
    totalImageCount: 61,
    coverPageUrl: "https://www.turboimagehost.com/p/130313020/44.png.html"
  }
};

const updatedAlbums = [album1, album2, album3];

fs.writeFileSync('src/data/albums.json', JSON.stringify(updatedAlbums, null, 2), 'utf-8');

console.log('='.repeat(70));
console.log('Updated src/data/albums.json:');
console.log(`- Album 1: ${album1.title} (${album1.photographs.length} photos)`);
console.log(`- Album 2: ${album2.title} (${album2.photographs.length} photos)`);
console.log(`- Album 3: ${album3.title} (${album3.photographs.length} photos)`);
console.log(`Total Albums: ${updatedAlbums.length}`);
console.log(`Total Photographs across portfolio: ${album1.photographs.length + album2.photographs.length + album3.photographs.length}`);
console.log('='.repeat(70));
