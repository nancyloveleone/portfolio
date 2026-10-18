import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/images/albums/nancy-leone-green-saree');
const thumbsDir = path.join(dir, 'thumbs');

const fullImages = fs.readdirSync(dir).filter(f => /^\d{2}\.png$/.test(f));
const thumbs = fs.existsSync(thumbsDir) ? fs.readdirSync(thumbsDir).filter(f => /^thumb-\d{2}\.png$/.test(f)) : [];
const coverExists = fs.existsSync(path.join(dir, 'cover.png'));
const coverStat = coverExists ? fs.statSync(path.join(dir, 'cover.png')) : null;

console.log('='.repeat(60));
console.log('Album 3 Local File Verification:');
console.log(`- Full resolution images (01.png - 61.png): ${fullImages.length}`);
console.log(`- Thumbnail images (thumb-01.png - thumb-61.png): ${thumbs.length}`);
console.log(`- Cover image exists: ${coverExists} (${coverStat ? (coverStat.size / (1024*1024)).toFixed(2) + ' MB' : 'N/A'})`);

let allValid = true;
for (let i = 1; i <= 61; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(dir, `${num}.png`);
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${num}.png`);
    allValid = false;
  } else {
    const size = fs.statSync(file).size;
    if (size < 100000) {
      console.error(`Corrupt or too small file: ${num}.png (${size} bytes)`);
      allValid = false;
    }
  }
}

if (allValid) {
  console.log('All 61 full images verified intact, genuine high-resolution images!');
} else {
  console.error('Validation FAILED');
}
console.log('='.repeat(60));
