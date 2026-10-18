import https from 'node:https';
import fs from 'node:fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.turboimagehost.com/'
};

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { ...HEADERS, Referer: url }, timeout: 15000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', err => resolve({ statusCode: 500, error: err.message }))
      .on('timeout', () => resolve({ statusCode: 408, error: 'timeout' }));
  });
}

function parseAlbumThumbnails(html) {
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

function extractDirectUrl(body) {
  if (!body) return null;
  const og = body.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (og && og[1]) return og[1];
  const show = body.match(/id=["']show_image["'][^>]*src=["']([^"']+)["']/i);
  if (show && show[1]) return show[1];
  return null;
}

async function scrapeAlbum(baseUrl) {
  console.log(`Scraping album: ${baseUrl}`);
  const p1 = await fetchText(baseUrl);
  if (p1.statusCode !== 200) {
    throw new Error(`Failed to fetch page 1: HTTP ${p1.statusCode}`);
  }
  const itemsP1 = parseAlbumThumbnails(p1.body);
  console.log(`Page 1 found: ${itemsP1.length} images`);

  let allItems = [...itemsP1];
  let pageNum = 2;
  while (true) {
    const nextUrl = `${baseUrl}?p=${pageNum}`;
    const pNext = await fetchText(nextUrl);
    if (pNext.statusCode !== 200) {
      console.log(`Page ${pageNum} returned HTTP ${pNext.statusCode}. Ending pagination.`);
      break;
    }
    const nextItems = parseAlbumThumbnails(pNext.body);
    if (nextItems.length === 0) {
      console.log(`Page ${pageNum} has 0 items. Ending pagination.`);
      break;
    }
    if (nextItems[0].pageUrl === itemsP1[0].pageUrl) {
      console.log(`Page ${pageNum} is duplicate of page 1. Ending pagination.`);
      break;
    }
    console.log(`Page ${pageNum} found: ${nextItems.length} images`);
    allItems = allItems.concat(nextItems);
    pageNum++;
  }

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const item of allItems) {
    if (!seen.has(item.pageUrl)) {
      seen.add(item.pageUrl);
      deduped.push(item);
    }
  }
  console.log(`Total unique images discovered: ${deduped.length}`);
  fs.writeFileSync('scripts/album4_items.json', JSON.stringify(deduped, null, 2), 'utf-8');
  return deduped;
}

// Concurrency helper
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

async function resolveImages(items) {
  console.log(`Resolving direct URLs for ${items.length} items (concurrency 5)...`);
  const resolved = {};
  let completed = 0;

  await mapConcurrent(items, 5, async (item, i) => {
    let retries = 3;
    let directUrl = null;
    while (retries > 0 && !directUrl) {
      const res = await fetchText(item.pageUrl);
      if (res.statusCode === 200) {
        directUrl = extractDirectUrl(res.body);
      }
      if (!directUrl) {
        retries--;
        if (retries > 0) await sleep(500);
      }
    }

    completed++;
    if (directUrl) {
      resolved[item.pageUrl] = {
        index: i + 1,
        pageUrl: item.pageUrl,
        directUrl,
        thumbUrl: item.thumbUrl
      };
      if (completed % 10 === 0 || completed === items.length) {
        console.log(`Resolved [${completed}/${items.length}]: ${directUrl}`);
      }
    } else {
      console.error(`FAILED to resolve: ${item.pageUrl}`);
    }
  });

  fs.writeFileSync('scripts/resolved_album4.json', JSON.stringify(resolved, null, 2), 'utf-8');
  console.log(`Saved resolved data to scripts/resolved_album4.json (total: ${Object.keys(resolved).length})`);
  return resolved;
}

async function resolveCover(coverPageUrl, resolved) {
  if (resolved[coverPageUrl]) {
    console.log(`Cover image already resolved: ${resolved[coverPageUrl].directUrl}`);
    return resolved[coverPageUrl].directUrl;
  }
  console.log(`Resolving cover page directly: ${coverPageUrl}`);
  const res = await fetchText(coverPageUrl);
  const directUrl = extractDirectUrl(res.body);
  console.log(`Cover image direct URL: ${directUrl}`);
  return directUrl;
}

async function main() {
  const albumUrl = 'https://www.turboimagehost.com/album/412649/white_pearl_goddess';
  const coverPageUrl = 'https://www.turboimagehost.com/p/130331796/17.png.html';

  const items = await scrapeAlbum(albumUrl);
  const resolved = await resolveImages(items);
  const coverDirectUrl = await resolveCover(coverPageUrl, resolved);

  console.log('='.repeat(70));
  console.log('Album 4 (White Pearl Goddess) Summary:');
  console.log(`Total images: ${items.length}`);
  console.log(`Resolved direct URLs: ${Object.keys(resolved).length}/${items.length}`);
  console.log(`Cover direct URL: ${coverDirectUrl}`);
  console.log('='.repeat(70));
}

main().catch(console.error);
