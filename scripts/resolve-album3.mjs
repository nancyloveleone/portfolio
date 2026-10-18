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

async function run() {
  const items = JSON.parse(fs.readFileSync('scripts/album3_items.json', 'utf-8'));
  console.log(`Resolving ${items.length} images for Album 3: Nancy Leone in Green Saree...`);

  const coverPageUrl = 'https://www.turboimagehost.com/p/130313020/44.png.html';
  const coverItemIndex = items.findIndex(it => it.pageUrl === coverPageUrl || it.pageUrl.includes('130313020'));
  console.log(`Cover image index in original album items list: ${coverItemIndex}`);

  const outputFile = 'scripts/resolved_album3.json';
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

    await sleep(150);
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
        console.log(`OK -> ${directUrl}`);
      } else {
        console.log('NO DIRECT URL');
        failCount++;
      }
    } else {
      console.log(`HTTP ${res.status}`);
      failCount++;
    }

    if (i % 10 === 0) {
      fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), 'utf-8');
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`\nCompleted Album 3: ${successCount} succeeded, ${failCount} failed.`);

  // Specifically check cover image resolution
  if (existing[coverPageUrl]) {
    console.log(`Cover Image Direct URL: ${existing[coverPageUrl].directUrl}`);
  } else {
    console.log('Cover image was not among the resolved items, resolving directly...');
    const covRes = await fetchPage(coverPageUrl);
    const covDirect = extractDirectUrl(covRes.body);
    console.log(`Direct cover URL resolved: ${covDirect}`);
  }
}

run().catch(console.error);
