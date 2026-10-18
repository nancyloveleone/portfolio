/**
 * ============================================================================
 * TURBOIMAGEHOST ALBUM IMPORTER & MANIFEST GENERATOR
 * ============================================================================
 * 
 * Usage:
 *   node scripts/import-albums.mjs <album-url> [--slug <custom-slug>] [--title <custom-title>] [--category <category>]
 * 
 * Example:
 *   node scripts/import-albums.mjs "https://www.turboimagehost.com/album/199867/auroradxb_/" --slug "aurora-dusk" --title "Aurora in Dusk" --category "Editorial"
 * 
 * Features:
 *   - Parses TurboImageHost album pages & discovers image viewer links (/p/{id}/{file}.html)
 *   - Resolves direct high-res CDN media URLs from #show_image & og:image
 *   - Downloads permitted photographs into public/images/albums/{slug}/
 *   - Sets cover.jpg automatically
 *   - Deduplicates and safely skips existing files
 *   - Updates src/data/albums.json automatically
 *   - Emits a clean import report with stats and diagnostics
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const ALBUMS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'albums.json');
const ALBUMS_DIR = path.join(ROOT_DIR, 'public', 'images', 'albums');
const REPORTS_DIR = path.join(ROOT_DIR, 'import-reports');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.turboimagehost.com/'
};

// Sleep utility to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Safe HTTP/HTTPS GET returning text body
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(url, { headers: HEADERS, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return fetchText(nextUrl).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} loading ${url}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

// Download binary image file with retries
function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(url, { headers: { ...HEADERS, Referer: url }, timeout: 20000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return downloadBinary(nextUrl, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      fs.unlink(destPath, () => {});
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

// Extract album name from TurboImageHost album URL
function parseAlbumMetaFromUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const parts = url.pathname.split('/').filter(Boolean);
    // Format: /album/{album_id}/{album_name}/
    if (parts.length >= 2 && parts[0] === 'album') {
      const albumId = parts[1];
      const rawSlug = parts[2] || `album-${albumId}`;
      const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const readableTitle = (parts[2] || `Album ${albumId}`)
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { albumId, slug: cleanSlug, title: readableTitle };
    }
  } catch {}
  return {
    albumId: String(Date.now()),
    slug: `imported-album-${Date.now()}`,
    title: 'Imported Editorial Photoshoot'
  };
}

// Extract viewer links from album page HTML
function extractViewerLinks(html, baseUrl) {
  const viewerLinks = new Set();

  // Pattern 1: standard href="/p/..." or href="https://www.turboimagehost.com/p/..."
  const regexA = /href=["']((?:https?:\/\/[^"']*)?\/p\/(\d+)\/[^"']*\.html)["']/gi;
  let match;
  while ((match = regexA.exec(html)) !== null) {
    try {
      const fullUrl = new URL(match[1], baseUrl).href;
      viewerLinks.add(fullUrl);
    } catch {}
  }

  // Pattern 2: direct CDN image patterns
  const regexDirect = /(https?:\/\/[a-zA-Z0-9_.-]*turboimagehost\.com\/sev\d+\/\d+\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))/gi;
  const directLinks = new Set();
  while ((match = regexDirect.exec(html)) !== null) {
    directLinks.add(match[1]);
  }

  return {
    viewerUrls: Array.from(viewerLinks),
    directUrls: Array.from(directLinks)
  };
}

// Extract high-resolution direct image URL from a single viewer page
function extractDirectImageFromViewerHtml(html, pageUrl) {
  // Method 1: <img id="show_image" src="..." ...>
  const matchShowImg = /<img[^>]+id=["']show_image["'][^>]+src=["']([^"']+)["']/i.exec(html)
    || /<img[^>]+src=["']([^"']+)["'][^>]+id=["']show_image["']/i.exec(html);
  if (matchShowImg && matchShowImg[1]) {
    return new URL(matchShowImg[1], pageUrl).href;
  }

  // Method 2: <meta property="og:image" content="..." />
  const matchOg = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
    || /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  if (matchOg && matchOg[1]) {
    return new URL(matchOg[1], pageUrl).href;
  }

  // Method 3: Any image matching /sev.../
  const matchSev = /https?:\/\/[a-zA-Z0-9_.-]*turboimagehost\.com\/sev\d+\/\d+\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)/i.exec(html);
  if (matchSev) {
    return matchSev[0];
  }

  return null;
}

// Main CLI runner
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
TurboImageHost Album Import Utility
-------------------------------------------------------------------------------
Usage:
  node scripts/import-albums.mjs <album-url> [options]

Options:
  --slug <name>        Custom album directory slug (default: derived from url)
  --title <name>       Custom album title
  --category <name>    Fashion | Editorial | Runway | Black & White | Commercial (default: Editorial)
  --year <year>        Year of photoshoot (default: current year)
  --location <city>    Location credit (default: "Paris & Milan")
  --photographer <name> Photographer credit (default: "Studio Archive")

Example:
  node scripts/import-albums.mjs "https://www.turboimagehost.com/album/199867/auroradxb_/" --slug "aurora-editorial"
`);
    process.exit(0);
  }

  const albumUrl = args[0];

  // Parse optional CLI flags
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const urlMeta = parseAlbumMetaFromUrl(albumUrl);
  const slug = getArg('--slug') || urlMeta.slug;
  const title = getArg('--title') || urlMeta.title;
  const category = getArg('--category') || 'Editorial';
  const year = getArg('--year') || String(new Date().getFullYear());
  const location = getArg('--location') || 'Paris Studio';
  const photographer = getArg('--photographer') || 'Guest Photographer';

  console.log('='.repeat(70));
  console.log(`Starting Album Import`);
  console.log(`Source URL : ${albumUrl}`);
  console.log(`Target Slug: ${slug}`);
  console.log(`Album Title: ${title}`);
  console.log('='.repeat(70));

  // Prepare directories
  const targetAlbumDir = path.join(ALBUMS_DIR, slug);
  if (!fs.existsSync(targetAlbumDir)) {
    fs.mkdirSync(targetAlbumDir, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const report = {
    albumUrl,
    slug,
    title,
    startedAt: new Date().toISOString(),
    discoveredViewerUrls: 0,
    downloadedImages: [],
    failedImages: [],
    skippedExisting: [],
    status: 'pending'
  };

  try {
    console.log('\n[1/4] Fetching album page content...');
    const albumHtml = await fetchText(albumUrl);
    const discovered = extractViewerLinks(albumHtml, albumUrl);
    report.discoveredViewerUrls = discovered.viewerUrls.length;

    console.log(`Found ${discovered.viewerUrls.length} photograph viewer pages.`);

    if (discovered.viewerUrls.length === 0 && discovered.directUrls.length === 0) {
      throw new Error(
        'No photographs were found at the provided URL. The album may be private, require authentication, or use unsupported markup.'
      );
    }

    const resolvedDirectUrls = [];

    // If direct URLs were already on the album page, use them
    for (const dUrl of discovered.directUrls) {
      if (!resolvedDirectUrls.includes(dUrl)) {
        resolvedDirectUrls.push(dUrl);
      }
    }

    // Otherwise resolve from each viewer page with friendly pacing
    if (resolvedDirectUrls.length === 0 && discovered.viewerUrls.length > 0) {
      console.log('\n[2/4] Resolving high-resolution image links from viewer pages...');
      for (let i = 0; i < discovered.viewerUrls.length; i++) {
        const vUrl = discovered.viewerUrls[i];
        process.stdout.write(`  [${i + 1}/${discovered.viewerUrls.length}] Resolving ${vUrl} ... `);
        try {
          await sleep(400); // 400ms delay to respect host
          const vHtml = await fetchText(vUrl);
          const directImg = extractDirectImageFromViewerHtml(vHtml, vUrl);
          if (directImg) {
            resolvedDirectUrls.push(directImg);
            console.log('OK');
          } else {
            console.log('NOT FOUND');
            report.failedImages.push({ url: vUrl, reason: 'No #show_image or og:image in DOM' });
          }
        } catch (err) {
          console.log(`ERROR: ${err.message}`);
          report.failedImages.push({ url: vUrl, reason: err.message });
        }
      }
    }

    console.log(`\n[3/4] Downloading ${resolvedDirectUrls.length} high-resolution photographs...`);
    const savedPhotographs = [];

    for (let i = 0; i < resolvedDirectUrls.length; i++) {
      const imgUrl = resolvedDirectUrls[i];
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const fileNumber = String(i + 1).padStart(3, '0');
      const filename = `${fileNumber}${ext.toLowerCase()}`;
      const destPath = path.join(targetAlbumDir, filename);

      const photoRelPath = `/images/albums/${slug}/${filename}`;

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
        console.log(`  [${i + 1}/${resolvedDirectUrls.length}] Skipping existing: ${filename}`);
        report.skippedExisting.push(filename);
      } else {
        process.stdout.write(`  [${i + 1}/${resolvedDirectUrls.length}] Downloading: ${filename} ... `);
        try {
          await sleep(300);
          await downloadBinary(imgUrl, destPath);
          console.log('DONE');
          report.downloadedImages.push({ filename, url: imgUrl });
        } catch (err) {
          console.log(`FAILED (${err.message})`);
          report.failedImages.push({ url: imgUrl, reason: err.message });
          continue;
        }
      }

      savedPhotographs.push({
        id: `${slug}-${fileNumber}`,
        src: photoRelPath,
        title: `${title} — Frame ${fileNumber}`,
        caption: `Editorial photograph from the ${title} collection.`,
        photographer,
        year,
        location
      });
    }

    if (savedPhotographs.length === 0) {
      throw new Error('No photographs could be downloaded successfully.');
    }

    // Ensure cover.jpg exists (copy first image to cover.jpg if not present)
    const coverDest = path.join(targetAlbumDir, 'cover.jpg');
    if (!fs.existsSync(coverDest)) {
      const firstImg = path.join(targetAlbumDir, '001.jpg');
      if (fs.existsSync(firstImg)) {
        fs.copyFileSync(firstImg, coverDest);
      }
    }

    console.log('\n[4/4] Updating website album manifest (src/data/albums.json)...');
    let albums = [];
    if (fs.existsSync(ALBUMS_JSON_PATH)) {
      try {
        albums = JSON.parse(fs.readFileSync(ALBUMS_JSON_PATH, 'utf-8'));
      } catch {
        albums = [];
      }
    }

    const existingIdx = albums.findIndex((a) => a.slug === slug);
    const newAlbumEntry = {
      id: existingIdx !== -1 ? albums[existingIdx].id : `album-${Date.now()}`,
      slug,
      title,
      category,
      year,
      location,
      photographer,
      description: `Curated ${category.toLowerCase()} photoshoot collection captured in ${location}.`,
      coverImage: `/images/albums/${slug}/cover.jpg`,
      featured: true,
      sortOrder: existingIdx !== -1 ? albums[existingIdx].sortOrder : albums.length + 1,
      photographs: savedPhotographs,
      sourceMeta: {
        importedFrom: 'TurboImageHost',
        importDate: new Date().toISOString(),
        originalAlbumUrl: albumUrl
      }
    };

    if (existingIdx !== -1) {
      albums[existingIdx] = newAlbumEntry;
    } else {
      albums.push(newAlbumEntry);
    }

    fs.writeFileSync(ALBUMS_JSON_PATH, JSON.stringify(albums, null, 2), 'utf-8');
    console.log(`Album manifest successfully updated! Total albums: ${albums.length}`);

    report.status = 'success';
    report.completedAt = new Date().toISOString();
  } catch (err) {
    console.error(`\nImport terminated with error: ${err.message}`);
    report.status = 'error';
    report.error = err.message;
  }

  // Save detailed import report
  const reportPath = path.join(REPORTS_DIR, `import-${slug}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nDetailed import diagnostic saved to: ${reportPath}`);
  console.log('='.repeat(70));
}

main();
