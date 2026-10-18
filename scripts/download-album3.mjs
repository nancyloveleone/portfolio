import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Referer': 'https://www.turboimagehost.com/'
};

const TARGET_DIR = path.resolve('public/images/albums/nancy-leone-green-saree');
const THUMBS_DIR = path.join(TARGET_DIR, 'thumbs');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBS_DIR)) {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

function downloadFile(url, destPath, retries = 3) {
  return new Promise((resolve, reject) => {
    // If file already exists and has size > 100000 bytes (or thumbs > 2000 bytes), skip
    const isThumb = destPath.includes('thumb');
    const minSize = isThumb ? 2000 : 100000;
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > minSize) {
      return resolve({ cached: true, size: fs.statSync(destPath).size });
    }

    const tempPath = `${destPath}.tmp`;
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(url, { headers: HEADERS, timeout: 45000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return downloadFile(nextUrl, destPath, retries - 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const fileStream = fs.createWriteStream(tempPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          fs.renameSync(tempPath, destPath);
          const size = fs.statSync(destPath).size;
          resolve({ cached: false, size });
        });
      });

      fileStream.on('error', (err) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      });
    });


    req.on('error', (err) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (retries > 0) {
        setTimeout(() => {
          downloadFile(url, destPath, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (retries > 0) {
        setTimeout(() => {
          downloadFile(url, destPath, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(new Error(`Timeout downloading ${url}`));
      }
    });
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

async function run() {
  console.log('='.repeat(70));
  console.log('Starting Album 3 Image Download');
  console.log(`Destination: ${TARGET_DIR}`);
  console.log('='.repeat(70));

  const itemsMap = JSON.parse(fs.readFileSync('scripts/resolved_album3.json', 'utf-8'));
  const items = Object.values(itemsMap).sort((a, b) => a.index - b.index);

  console.log(`Total images to download: ${items.length}`);

  // 1. Download Cover Image (item index 44, which is index 43 in 0-indexed or 44.png)
  const coverDirectUrl = 'https://s8d8.turboimg.net/sp/8cde9a55aef3c77d927688433198242c/44.png';
  const coverPath = path.join(TARGET_DIR, 'cover.png');
  console.log(`\nDownloading Cover Image (frame 44) to ${coverPath}...`);
  const covRes = await downloadFile(coverDirectUrl, coverPath);
  console.log(`Cover downloaded: ${(covRes.size / (1024 * 1024)).toFixed(2)} MB ${covRes.cached ? '(cached)' : ''}`);

  // 2. Download all 61 full images concurrently (3 concurrent downloads)
  console.log('\nDownloading 61 full-resolution images (concurrency: 3)...');
  let downloadedCount = 0;
  let failedCount = 0;

  const _downloadResults = await mapConcurrent(items, 3, async (item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const filename = `${num}.png`;
    const destPath = path.join(TARGET_DIR, filename);

    try {
      const res = await downloadFile(item.directUrl, destPath);
      downloadedCount++;
      const mb = (res.size / (1024 * 1024)).toFixed(2);
      console.log(`[${idx + 1}/${items.length}] Downloaded ${filename} (${mb} MB) ${res.cached ? '[cached]' : ''}`);
      return { success: true, filename, size: res.size };
    } catch (err) {
      failedCount++;
      console.error(`[${idx + 1}/${items.length}] FAILED ${filename}: ${err.message}`);
      return { success: false, filename, error: err.message };
    }
  });

  // 3. Download all 61 thumbnails concurrently (4 concurrent downloads)
  console.log('\nDownloading 61 thumbnails (concurrency: 4)...');
  await mapConcurrent(items, 4, async (item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const thumbFilename = `thumb-${num}.png`;
    const thumbPath = path.join(THUMBS_DIR, thumbFilename);

    try {
      await downloadFile(item.thumbUrl, thumbPath);
    } catch (err) {
      console.warn(`Warning: failed thumb ${thumbFilename}: ${err.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('Download Summary:');
  console.log(`- Images Discovered: ${items.length}`);
  console.log(`- Images Successfully Downloaded: ${downloadedCount}`);
  console.log(`- Failed Downloads: ${failedCount}`);
  console.log(`- Cover Image: ${coverPath} (${(fs.statSync(coverPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log('='.repeat(70));
}

run().catch(console.error);
