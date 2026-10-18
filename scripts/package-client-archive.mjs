import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const ARCHIVE_NAME = 'model-portfolio-client-handover.zip';
const ARCHIVE_PATH = path.join(ROOT_DIR, ARCHIVE_NAME);
const TEMP_STAGE_DIR = path.join(ROOT_DIR, 'scratch-package-stage', 'model-portfolio');

const INCLUDED_FILES = [
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vercel.json',
  'CLIENT_GUIDE.md',
  'README.md',
  '.gitignore',
  '.env.example'
];

const INCLUDED_DIRS = [
  'src',
  'public',
  'scripts'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    // Skip public/images/albums
    if (src.endsWith(path.join('public', 'images', 'albums'))) {
      fs.mkdirSync(dest, { recursive: true });
      return;
    }
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}


async function run() {
  console.log('='.repeat(70));
  console.log(`Packaging Client Handover Archive: ${ARCHIVE_NAME}`);

  // Clean staging
  if (fs.existsSync(TEMP_STAGE_DIR)) {
    fs.rmSync(path.dirname(TEMP_STAGE_DIR), { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_STAGE_DIR, { recursive: true });

  // Copy files
  for (const file of INCLUDED_FILES) {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(TEMP_STAGE_DIR, file));
      console.log(`Included file: ${file}`);
    } else {
      console.warn(`File not found: ${file}`);
    }
  }

  // Copy dirs
  for (const dir of INCLUDED_DIRS) {
    const src = path.join(ROOT_DIR, dir);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(TEMP_STAGE_DIR, dir));
      console.log(`Included directory: ${dir}/`);
    } else {
      console.warn(`Directory not found: ${dir}`);
    }
  }

  // Delete previous archive if present
  if (fs.existsSync(ARCHIVE_PATH)) {
    fs.unlinkSync(ARCHIVE_PATH);
  }

  // Use powershell Compress-Archive to create standard zip
  console.log('Compressing archive...');
  const stageParent = path.dirname(TEMP_STAGE_DIR);
  execSync(
    `powershell.exe -NoProfile -Command "Compress-Archive -Path '${TEMP_STAGE_DIR}' -DestinationPath '${ARCHIVE_PATH}' -Force"`
  );

  const archiveStat = fs.statSync(ARCHIVE_PATH);
  const sizeMb = (archiveStat.size / (1024 * 1024)).toFixed(2);
  console.log(`Archive created successfully!`);
  console.log(`Location: ${ARCHIVE_PATH}`);
  console.log(`File Size: ${sizeMb} MB`);

  // Clean staging directory
  fs.rmSync(stageParent, { recursive: true, force: true });
  console.log('Temporary staging directory cleaned.');
  console.log('='.repeat(70));
}

run().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
