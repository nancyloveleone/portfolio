import https from 'node:https';
import fs from 'node:fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.turboimagehost.com/'
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

function parseAlbumThumbnails(html) {
  // Pattern: <div title="..." class="..."><a href="(url)" class="thumbUrl" style="background-image:url('(thumb)')"></a><br />
  // or href="https://www.turboimagehost.com/p/..."
  const regex = /<a\s+href=["']([^"']+\/p\/\d+\/[^"']+\.html)["'][^>]*style=["']background-image:url\(['"]?([^'"]+)['"]?\)/gi;
  const items = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    items.push({
      pageUrl: m[1],
      thumbUrl: m[2]
    });
  }
  return items;
}

async function inspectAlbum(name, baseUrl) {
  console.log(`\n=== Inspecting ${name}: ${baseUrl} ===`);
  const p1Res = await fetchText(baseUrl);
  const p1Items = parseAlbumThumbnails(p1Res.body);
  console.log(`Page 1 count: ${p1Items.length}`);

  // Check pagination
  let p2Items = [];
  const p2Url = baseUrl.includes('?') ? `${baseUrl}&p=2` : `${baseUrl}?p=2`;
  const p2Res = await fetchText(p2Url);
  if (p2Res.statusCode === 200) {
    p2Items = parseAlbumThumbnails(p2Res.body);
    console.log(`Page 2 count: ${p2Items.length}`);
  }

  const allItems = [...p1Items, ...p2Items];
  console.log(`Total items found across both pages: ${allItems.length}`);
  return allItems;
}

async function run() {
  const album1 = await inspectAlbum('Album 1 (Debut)', 'https://www.turboimagehost.com/album/412606/nancy_leone_debut');
  const album2 = await inspectAlbum('Album 2 (Greek Goddess)', 'https://www.turboimagehost.com/album/412610/nancy_leone_gg');

  fs.writeFileSync('scripts/album1_items.json', JSON.stringify(album1, null, 2));
  fs.writeFileSync('scripts/album2_items.json', JSON.stringify(album2, null, 2));
  console.log('\nSaved item lists to scripts/album1_items.json and scripts/album2_items.json');
}

run().catch(console.error);
