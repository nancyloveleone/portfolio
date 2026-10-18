import fs from 'node:fs';

const existingAlbums = JSON.parse(fs.readFileSync('src/data/albums.json', 'utf-8'));
console.log(`Found ${existingAlbums.length} existing albums.`);

const resolvedA4 = JSON.parse(fs.readFileSync('scripts/resolved_album4.json', 'utf-8'));
const items = Object.values(resolvedA4).sort((a, b) => a.index - b.index);

const album4Photos = items.map((item, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  return {
    id: `white-pearl-${num}`,
    src: item.directUrl,
    thumbSrc: item.thumbUrl,
    title: `White Pearl Goddess — Frame ${num}`,
    caption: `White Pearl Goddess (Frame ${idx + 1} of ${items.length})`
  };
});

const coverDirectUrl = 'https://s8d8.turboimg.net/sp/121be4a8a1977515e9802dc79a958df6/17.png';

const album4 = {
  id: "album-white-pearl-goddess",
  slug: "white-pearl-goddess",
  title: "White Pearl Goddess",
  category: "Goddess",
  description: "Sensual White Pearl Goddess photoshoot collection featuring 117 verified high-resolution photographs.",
  coverImage: coverDirectUrl,
  featured: true,
  sortOrder: 4,
  photographs: album4Photos,
  sourceMeta: {
    importedFrom: "TurboImageHost",
    importDate: new Date().toISOString(),
    originalAlbumUrl: "https://www.turboimagehost.com/album/412649/white_pearl_goddess",
    totalImageCount: items.length,
    coverPageUrl: "https://www.turboimagehost.com/p/130331796/17.png.html"
  }
};

// Check if album4 is already in existingAlbums
const existingIndex = existingAlbums.findIndex(a => a.id === album4.id || a.slug === album4.slug);
let updatedAlbums;
if (existingIndex >= 0) {
  updatedAlbums = [...existingAlbums];
  updatedAlbums[existingIndex] = album4;
} else {
  updatedAlbums = [...existingAlbums, album4];
}

fs.writeFileSync('src/data/albums.json', JSON.stringify(updatedAlbums, null, 2), 'utf-8');

console.log('='.repeat(70));
console.log('Updated src/data/albums.json:');
updatedAlbums.forEach((a, idx) => {
  console.log(`- Album ${idx + 1}: ${a.title} (${a.photographs.length} photos, cover: ${a.coverImage})`);
});
console.log(`Total Albums: ${updatedAlbums.length}`);
console.log(`Total Photographs across portfolio: ${updatedAlbums.reduce((sum, a) => sum + a.photographs.length, 0)}`);
console.log('='.repeat(70));
