import https from 'node:https';
import fs from 'node:fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.turboimagehost.com/'
};

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { ...HEADERS, Referer: url }, timeout: 15000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', err => resolve({ status: 500, error: err.message }))
      .on('timeout', () => resolve({ status: 408, error: 'timeout' }));
  });
}

function extractDirectUrl(body) {
  if (!body) return null;
  const og = body.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (og && og[1]) return og[1];
  const show = body.match(/id=["']show_image["'][^>]*src=["']([^"']+)["']/i);
  if (show && show[1]) return show[1];
  return null;
}

async function resolveAlbum(itemsFile, outputFile, albumName) {
  console.log(`\n======================================================`);
  console.log(`Resolving images for ${albumName}...`);
  const items = JSON.parse(fs.readFileSync(itemsFile, 'utf-8'));
  console.log(`Total items to resolve: ${items.length}`);

  let existing = {};
  if (fs.existsSync(outputFile)) {
    try { existing = JSON.parse(fs.readFileSync(outputFile, 'utf-8')); } catch {}
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pageUrl = item.pageUrl;
    const thumbUrl = item.thumbUrl;

    if (existing[pageUrl]?.directUrl) {
      results.push(existing[pageUrl]);
      successCount++;
      continue;
    }

    await sleep(200); // 200ms delay to avoid rate limiting
    process.stdout.write(`[${i + 1}/${items.length}] ${pageUrl.split('/').slice(-1)[0]} ... `);

    const res = await fetchPage(pageUrl);
    if (res.status === 200) {
      const directUrl = extractDirectUrl(res.body);
      if (directUrl) {
        const record = {
          index: i + 1,
          pageUrl,
          directUrl,
          thumbUrl
        };
        results.push(record);
        existing[pageUrl] = record;
        successCount++;
        console.log('OK');
      } else {
        console.log('NO DIRECT URL');
        failCount++;
      }
    } else {
      console.log(`HTTP ${res.status}`);
      failCount++;
    }

    // Periodically save progress
    if (i % 10 === 0) {
      fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2));
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2));
  console.log(`Completed ${albumName}: ${successCount} succeeded, ${failCount} failed.`);
  return results;
}

async function run() {
  await resolveAlbum('scripts/album1_items.json', 'scripts/resolved_album1.json', 'Album 1: Debut');
  await resolveAlbum('scripts/album2_items.json', 'scripts/resolved_album2.json', 'Album 2: Greek Goddess');
  console.log('\nAll album images resolved successfully!');
}

run().catch(console.error);
