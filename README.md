# Nancy Leone — Model Photography Portfolio

A responsive, production-quality photography portfolio website built for **Nancy Leone**, amateur model based in Denver. Built with **React 19**, **TypeScript**, **Vite**, and bespoke **editorial Vanilla CSS**. Fully structured and configured for zero-configuration deployment to **Vercel**.

---

## Key Highlights & Features

- **Dark Luxury Aesthetics**: Dark obsidian palette (`#090909`, `#141414`, `#1D1D1D`) with Champagne Gold (`#D6B56D`, `#F2CE74`) accents and typography pairing (`Playfair Display`, `Cormorant Garamond`, `Plus Jakarta Sans`).
- **100svh Hero Landing**: Viewport-height landing cover with centered portrait presentation on mobile and desktop, authentic headline, and booking actions.
- **Curated Photoshoot Albums (Remote CDN Streaming)**:
  - **Nancy Leone Debut Photoshoot**: 77 verified high-resolution photographs streaming via CDN.
  - **Nancy Leone Showing it like Greek Goddess**: 89 verified high-resolution photographs streaming via CDN.
  - **Nancy Leone in Green Saree**: 61 verified high-resolution photographs streaming via CDN.
  - Zero local album photo bundling: all 227 photographs and covers stream directly from TurboImageHost CDN (`s8d8.turboimg.net`), resulting in lightweight builds and zero disk bloat.
- **Full-Screen Photography Lightbox**:
  - Fullscreen API support (toggle with `F` key or on-screen button).
  - Uncompromised aspect ratios (`object-fit: contain`).
  - Mobile touch swipe gestures (swipe left/right).
  - Bottom filmstrip thumbnail browser with lightweight thumbnails.
  - Autoplay / Slideshow mode (toggle with `Spacebar`).
  - Caption overlays (toggle with `W` key).
  - Preloaded adjacent assets for instant next/prev response.
- **Authentic About Profile**: Authentic biographical statement with high-resolution profile portrait. No invented measurements or fake credentials.
- **Client-Friendly Content Management**: 100% separated data architecture in `src/data/site-config.json` and `src/data/albums.json`.
- **Private Contact Retention**: Direct client contact info (`nancyloveleone@gmail.com`) is stored privately in documentation for future use, with no public-facing forms or exposed email addresses on the website.

---

## Lightbox Keyboard Controls

| Key | Action |
|---|---|
| `→` / `D` | Advance to next photograph |
| `←` / `A` | Return to previous photograph |
| `F` | Toggle browser Fullscreen mode |
| `W` | Toggle photograph info & caption |
| `S` | Toggle thumbnail filmstrip bar |
| `Space` | Toggle automatic slideshow |
| `Home` | Jump to first photograph |
| `End` | Jump to last photograph |
| `Esc` | Close active lightbox viewer |

---

## Project Structure

```text
├── CLIENT_GUIDE.md           # Non-technical step-by-step editing guide
├── README.md                 # Project architecture & developer documentation
├── vercel.json               # Vercel deployment & cache optimization config
├── package.json              # Dependencies and run scripts
├── index.html                # Entry HTML with Google Fonts, SEO & no-referrer policy
├── public/
│   ├── favicon.svg           # NL monogram favicon
│   └── images/
│       ├── hero/             # Hero & portrait image assets (hero-main.png, about-portrait.png, hero-alt.png)
│       └── albums/           # (Excluded via .gitignore; albums stream from CDN)
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces for albums, photos, & config
│   ├── data/
│   │   ├── site-config.json  # Brand copy, model name, bio
│   │   ├── albums.json       # Centralized album manifest (227 verified remote CDN photos)
│   │   └── index.ts          # Typed data exports and query helpers

│   ├── components/
│   │   ├── Navbar.tsx        # Responsive navigation with mobile drawer
│   │   ├── Hero.tsx          # Centered 100svh opening hero with CTA actions
│   │   ├── FeaturedAlbums.tsx# Filterable album gallery (Debut / Twistys / Saree)
│   │   ├── LightboxViewer.tsx# Fullscreen lightbox viewer with keyboard/swipe

│   │   ├── AboutSection.tsx  # Authentic bio & portrait
│   │   └── Footer.tsx        # Minimalist footer & back-to-top
│   ├── index.css             # Design system tokens and global typography
│   ├── App.tsx               # Main application controller
│   └── main.tsx              # React mounting entry point
└── scripts/
    ├── import-albums.mjs     # TurboImageHost album importer
    ├── scan-local-albums.mjs # Drag-and-drop local album scanner
    ├── resolve-all-album-images.mjs # Batch resolver for album images
    └── build-nancy-albums-json.mjs  # Manifest compiler
```

---


## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
The compiled, optimized static distribution is emitted to `dist/`.

---

## Deploying to Vercel

This repository is configured for zero-configuration deployment to [Vercel](https://vercel.com).

### Option A: Via Vercel Web Dashboard (Recommended)
1. Push this code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## License
All photographs and media are the property of their respective copyright holders.
