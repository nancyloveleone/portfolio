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

async function run() {
  const baseUrl = 'https://www.turboimagehost.com/album/412621/nancy_leone_gs';
  console.log(`Inspecting Album 3: ${baseUrl}`);

  const p1 = await fetchText(baseUrl);
  console.log('Page 1 HTTP:', p1.statusCode);
  const itemsP1 = parseAlbumThumbnails(p1.body);
  console.log('Page 1 items count:', itemsP1.length);

  // Check all pagination links in HTML
  const paginationLinks = new Set();
  const pagRegex = /href=["']([^"']*[?&]p=\d+[^"']*)["']/gi;
  let m;
  while ((m = pagRegex.exec(p1.body)) !== null) {
    paginationLinks.add(m[1]);
  }
  console.log('Pagination links found on page 1:', Array.from(paginationLinks));

  // Also check title in page 1
  const titleMatch = p1.body.match(/<title>([^<]+)<\/title>/i);
  console.log('Page title:', titleMatch ? titleMatch[1] : 'N/A');

  // Let's try fetching subsequent pages
  let allItems = [...itemsP1];
  let pageNum = 2;
  while (true) {
    const nextUrl = `${baseUrl}?p=${pageNum}`;
    const pNext = await fetchText(nextUrl);
    if (pNext.statusCode !== 200) {
      console.log(`Page ${pageNum} returned HTTP ${pNext.statusCode}. Stopping pagination.`);
      break;
    }
    const nextItems = parseAlbumThumbnails(pNext.body);
    console.log(`Page ${pageNum} items count: ${nextItems.length}`);
    if (nextItems.length === 0) {
      console.log(`No items on page ${pageNum}. Stopping pagination.`);
      break;
    }
    // Check if duplicate of page 1
    if (nextItems[0].pageUrl === itemsP1[0].pageUrl) {
      console.log(`Page ${pageNum} returned identical items to page 1. Stopping pagination.`);
      break;
    }
    allItems = allItems.concat(nextItems);
    pageNum++;
  }

  console.log(`Total images discovered across all pages: ${allItems.length}`);

  // Deduplicate by pageUrl
  const seen = new Set();
  const deduped = [];
  for (const item of allItems) {
    if (!seen.has(item.pageUrl)) {
      seen.add(item.pageUrl);
      deduped.push(item);
    }
  }
  console.log(`Unique images: ${deduped.length}`);

  fs.writeFileSync('scripts/album3_items.json', JSON.stringify(deduped, null, 2), 'utf-8');
  console.log('Saved to scripts/album3_items.json');
}

run().catch(console.error);
