import fs from 'node:fs';
import https from 'node:https';

const r1 = JSON.parse(fs.readFileSync('scripts/resolved_album1.json', 'utf-8'));
const r2 = JSON.parse(fs.readFileSync('scripts/resolved_album2.json', 'utf-8'));
const r3 = JSON.parse(fs.readFileSync('scripts/resolved_album3.json', 'utf-8'));
const keys = JSON.parse(fs.readFileSync('scripts/resolved_key_images.json', 'utf-8'));

const cover1 = keys.cover_album1.directUrl;
const cover2 = keys.cover_album2.directUrl;
const cover3 = 'https://s8d8.turboimg.net/sp/8cde9a55aef3c77d927688433198242c/44.png';

console.log('='.repeat(70));
console.log('COMPREHENSIVE REMOTE URL AUDIT');
console.log('='.repeat(70));

const items1 = Object.values(r1).sort((a, b) => a.index - b.index);
const items2 = Object.values(r2).sort((a, b) => a.index - b.index);
const items3 = Object.values(r3).sort((a, b) => a.index - b.index);

console.log(`Album 1: ${items1.length} items`);
console.log(`Album 2: ${items2.length} items`);
console.log(`Album 3: ${items3.length} items`);
console.log(`Total Album Photos: ${items1.length + items2.length + items3.length}`);

function checkUrl(url) {
  return new Promise(resolve => {
    https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'], length: res.headers['content-length'] });
    }).on('error', err => resolve({ status: 500, error: err.message }))
      .on('timeout', () => resolve({ status: 408, error: 'timeout' }))
      .end();
  });
}

// Concurrency pool helper
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function verifyAlbum(name, items, coverUrl) {
  console.log(`\nVerifying remote URLs for ${name}...`);
  const covRes = await checkUrl(coverUrl);
  console.log(`  Cover URL status: ${covRes.status} (${covRes.contentType}, ${(covRes.length / 1024 / 1024).toFixed(2)} MB)`);

  let okDirect = 0, failDirect = 0;
  let okThumb = 0, failThumb = 0;

  // Check sample or all
  const _directResults = await mapConcurrent(items, 6, async (item) => {
    const res = await checkUrl(item.directUrl);
    if (res.status === 200) okDirect++;
    else {
      failDirect++;
      console.error(`  FAIL Direct: ${item.directUrl} -> HTTP ${res.status}`);
    }
    return res;
  });

  const _thumbResults = await mapConcurrent(items, 6, async (item) => {
    const res = await checkUrl(item.thumbUrl);
    if (res.status === 200) okThumb++;
    else {
      failThumb++;
      console.error(`  FAIL Thumb: ${item.thumbUrl} -> HTTP ${res.status}`);
    }
    return res;
  });


  console.log(`  Direct Photos: ${okDirect}/${items.length} OK, ${failDirect} failed.`);
  console.log(`  Thumbnails   : ${okThumb}/${items.length} OK, ${failThumb} failed.`);
  return { okDirect, failDirect, okThumb, failThumb };
}

async function run() {
  console.log('\nVerifying site key images (Hero & Portrait)...');
  const heroRes = await checkUrl(keys.hero.directUrl);
  console.log(`  Hero Main: HTTP ${heroRes.status} (${heroRes.contentType}, ${(heroRes.length / 1024 / 1024).toFixed(2)} MB)`);
  const altRes = await checkUrl(keys.hero_alt.directUrl);
  console.log(`  Hero Alt : HTTP ${altRes.status} (${altRes.contentType}, ${(altRes.length / 1024 / 1024).toFixed(2)} MB)`);
  const portRes = await checkUrl(keys.profile.directUrl);
  console.log(`  Portrait : HTTP ${portRes.status} (${portRes.contentType}, ${(portRes.length / 1024 / 1024).toFixed(2)} MB)`);

  const a1 = await verifyAlbum('Album 1 (Debut)', items1, cover1);
  const a2 = await verifyAlbum('Album 2 (Greek Goddess)', items2, cover2);
  const a3 = await verifyAlbum('Album 3 (Green Saree)', items3, cover3);

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT SUMMARY:');
  console.log(`Hero & Portrait: ${[heroRes, altRes, portRes].filter(r => r.status === 200).length}/3 OK`);
  console.log(`Total Albums Audited: 3`);
  console.log(`Album 1: ${a1.okDirect}/${items1.length} photos OK`);
  console.log(`Album 2: ${a2.okDirect}/${items2.length} photos OK`);
  console.log(`Album 3: ${a3.okDirect}/${items3.length} photos OK`);
  const keyFails = [heroRes, altRes, portRes].filter(r => r.status !== 200).length;
  const totalFail = keyFails + a1.failDirect + a2.failDirect + a3.failDirect + a1.failThumb + a2.failThumb + a3.failThumb;
  console.log(`Total Failures: ${totalFail}`);
  console.log('='.repeat(70));
}

run();
