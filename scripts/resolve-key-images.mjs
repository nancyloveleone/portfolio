import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.turboimagehost.com/'
};

const keyUrls = [
  { key: 'hero', url: 'https://www.turboimagehost.com/p/130301320/50.png.html', local: 'public/images/hero/hero-main.png' },
  { key: 'hero_alt', url: 'https://www.turboimagehost.com/p/130301329/51.png.html', local: 'public/images/hero/hero-alt.png' },
  { key: 'profile', url: 'https://www.turboimagehost.com/p/130301089/28.png.html', local: 'public/images/hero/about-portrait.png' },
  { key: 'cover_album1', url: 'https://www.turboimagehost.com/p/130301429/62.png.html', local: 'public/images/albums/nancy-leone-debut/cover.png' },
  { key: 'cover_album2', url: 'https://www.turboimagehost.com/p/130305043/94147ac9-c025-497.._207180641.png.html', local: 'public/images/albums/nancy-leone-greek-goddess/cover.png' }
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { ...HEADERS, Referer: url } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    https.get(url, { headers: { ...HEADERS, Referer: 'https://www.turboimagehost.com/' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} downloading ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Resolving key image pages...');
  const results = {};

  for (const item of keyUrls) {
    console.log(`\nResolving [${item.key}]: ${item.url}`);
    const res = await fetchText(item.url);
    if (res.status !== 200) {
      console.error(`Failed to fetch page: status ${res.status}`);
      continue;
    }

    const ogMatch = res.body.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const showImgMatch = res.body.match(/id=["']show_image["'][^>]*src=["']([^"']+)["']/i);
    const directUrl = ogMatch ? ogMatch[1] : (showImgMatch ? showImgMatch[1] : null);

    if (!directUrl) {
      console.error(`Could not find direct image for ${item.key}`);
      continue;
    }

    console.log(`Resolved direct URL: ${directUrl}`);
    results[item.key] = {
      pageUrl: item.url,
      directUrl,
      localPath: item.local
    };

    console.log(`Downloading to ${item.local} ...`);
    await downloadBinary(directUrl, item.local);
    console.log(`Saved ${item.local} (${(fs.statSync(item.local).size / 1024 / 1024).toFixed(2)} MB)`);
  }

  fs.writeFileSync('scripts/resolved_key_images.json', JSON.stringify(results, null, 2));
  console.log('\nKey images resolved and saved!');
}

run().catch(console.error);
