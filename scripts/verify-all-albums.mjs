import fs from 'node:fs';
import path from 'node:path';

const albums = JSON.parse(fs.readFileSync('src/data/albums.json', 'utf-8'));

console.log('='.repeat(70));
console.log('PORTFOLIO ALBUMS AUDIT & VERIFICATION');
console.log('='.repeat(70));
console.log(`Total Albums Registered: ${albums.length}`);

let totalPhotos = 0;
const allPhotoIds = new Set();
const allSrcs = new Set();
let duplicatesFound = false;

albums.forEach((album, aIdx) => {
  console.log(`\nAlbum ${aIdx + 1}: "${album.title}"`);
  console.log(`  ID: ${album.id}`);
  console.log(`  Slug: ${album.slug}`);
  console.log(`  Category: ${album.category}`);
  console.log(`  Cover Image: ${album.coverImage}`);
  console.log(`  Featured: ${album.featured}`);
  console.log(`  Sort Order: ${album.sortOrder}`);
  console.log(`  Photo Count: ${album.photographs.length}`);

  // Check cover file existence
  const localCover = path.resolve('public', album.coverImage.replace(/^\//, ''));
  if (fs.existsSync(localCover)) {
    console.log(`  Cover File Check: OK (${(fs.statSync(localCover).size / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    console.error(`  Cover File Check: MISSING at ${localCover}`);
  }

  // Verify photos
  album.photographs.forEach((photo, pIdx) => {
    if (allPhotoIds.has(photo.id)) {
      console.error(`  DUPLICATE PHOTO ID: ${photo.id}`);
      duplicatesFound = true;
    }
    allPhotoIds.add(photo.id);

    if (allSrcs.has(photo.src)) {
      console.error(`  DUPLICATE PHOTO SRC: ${photo.src}`);
      duplicatesFound = true;
    }
    allSrcs.add(photo.src);

    if (!photo.title || !photo.src) {
      console.error(`  INCOMPLETE PHOTO at index ${pIdx}: missing title or src`);
    }

    // If local src, check existence
    if (photo.src.startsWith('/')) {
      const fullPath = path.resolve('public', photo.src.replace(/^\//, ''));
      if (!fs.existsSync(fullPath)) {
        console.error(`  MISSING LOCAL FILE: ${photo.src}`);
      }
    }
  });

  totalPhotos += album.photographs.length;
});

console.log('\n' + '='.repeat(70));
console.log(`TOTAL PHOTOS AUDITED: ${totalPhotos}`);
console.log(`DUPLICATES FOUND: ${duplicatesFound ? 'YES (ERROR)' : 'NONE (PASS)'}`);
console.log('='.repeat(70));
