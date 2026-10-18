import https from 'node:https';
import fs from 'node:fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', err => resolve({ statusCode: 500, error: err.message }));
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
  const albumUrl = 'https://www.turboimagehost.com/album/412610/nancy_leone_gg';
  console.log(`Inspecting Album 2 on TurboImageHost: ${albumUrl}`);

  const res = await fetchText(albumUrl);
  console.log('Status:', res.statusCode);

  const regex = /<a\s+href=["']([^"']+\/p\/\d+\/[^"']+\.html)["'][^>]*style=["']background-image:url\(['"]?([^'"]+)['"]?\)/gi;
  const items = [];
  let m;
  while ((m = regex.exec(res.body)) !== null) {
    items.push({ pageUrl: m[1], thumbUrl: m[2] });
  }
  console.log('Page 1 items count:', items.length);

  if (items.length > 0) {
    console.log('Item 1 page:', items[0].pageUrl);
    console.log('Item 1 thumb:', items[0].thumbUrl);

    // Fetch the viewer page for item 1
    const vRes = await fetchText(items[0].pageUrl);
    console.log('Viewer page status:', vRes.statusCode);
    const direct = extractDirectUrl(vRes.body);
    console.log('Resolved direct URL:', direct);

    // Now test fetching that direct URL
    if (direct) {
      https.get(direct, { headers: { ...HEADERS, Referer: 'https://www.turboimagehost.com/' } }, imgRes => {
        console.log('Direct image fetch status:', imgRes.statusCode);
        console.log('Direct image content-type:', imgRes.headers['content-type']);
        console.log('Direct image location:', imgRes.headers.location);
      });
    }
  }

  // Also check resolved_album2.json
  if (fs.existsSync('scripts/resolved_album2.json')) {
    const r2 = JSON.parse(fs.readFileSync('scripts/resolved_album2.json', 'utf-8'));
    const firstKey = Object.keys(r2)[0];
    console.log('\nIn resolved_album2.json:');
    console.log('First key:', firstKey);
    console.log('First record:', r2[firstKey]);
  }

  // Also check resolved_album1.json
  if (fs.existsSync('scripts/resolved_album1.json')) {
    const r1 = JSON.parse(fs.readFileSync('scripts/resolved_album1.json', 'utf-8'));
    const firstKey = Object.keys(r1)[0];
    console.log('\nIn resolved_album1.json:');
    console.log('First key:', firstKey);
    console.log('First record:', r1[firstKey]);
  }
}

run();
