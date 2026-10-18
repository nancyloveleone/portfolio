import fs from 'node:fs';

const a1Items = JSON.parse(fs.readFileSync('scripts/resolved_album1.json', 'utf-8'));
const a2Items = JSON.parse(fs.readFileSync('scripts/resolved_album2.json', 'utf-8'));

const album1Photos = Object.values(a1Items).map((item, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  return {
    id: `debut-${num}`,
    src: item.directUrl,
    thumbSrc: item.thumbUrl,
    title: `Debut Photoshoot — Frame ${num}`,
    caption: `Nancy Leone Debut Photoshoot (Frame ${idx + 1} of 77)`
  };
});

const album2Photos = Object.values(a2Items).map((item, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  return {
    id: `greek-goddess-${num}`,
    src: item.directUrl,
    thumbSrc: item.thumbUrl,
    title: `Greek Goddess — Frame ${num}`,
    caption: `Nancy Leone Twistys Photoshoot (Frame ${idx + 1} of 89)`
  };
});

const albums = [
  {
    id: "album-debut",
    slug: "nancy-leone-debut",
    title: "Nancy Leone Debut Photoshoot",
    category: "Debut",
    description: "Official debut photoshoot collection featuring 77 verified high-resolution photographs.",
    coverImage: "/images/albums/nancy-leone-debut/cover.png",
    featured: true,
    sortOrder: 1,
    photographs: album1Photos,
    sourceMeta: {
      importedFrom: "TurboImageHost",
      importDate: new Date().toISOString(),
      originalAlbumUrl: "https://www.turboimagehost.com/album/412606/nancy_leone_debut",
      totalImageCount: 77
    }
  },
  {
    id: "album-greek-goddess",
    slug: "nancy-leone-greek-goddess",
    title: "Nancy Leone Showing it like Greek Goddess",
    category: "Twistys Photoshoot",
    description: "Twistys photoshoot collection featuring 89 verified high-resolution photographs.",
    coverImage: "/images/albums/nancy-leone-greek-goddess/cover.png",
    featured: true,
    sortOrder: 2,
    photographs: album2Photos,
    sourceMeta: {
      importedFrom: "TurboImageHost",
      importDate: new Date().toISOString(),
      originalAlbumUrl: "https://www.turboimagehost.com/album/412610/nancy_leone_gg",
      totalImageCount: 89
    }
  }
];

fs.writeFileSync('src/data/albums.json', JSON.stringify(albums, null, 2), 'utf-8');
console.log(`Generated src/data/albums.json with 2 verified albums:`);
console.log(`- Album 1 (Debut): ${album1Photos.length} photographs`);
console.log(`- Album 2 (Twistys): ${album2Photos.length} photographs`);
console.log(`Total photographs: ${album1Photos.length + album2Photos.length}`);
