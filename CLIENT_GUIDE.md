# Nancy Leone — Client Content Management Guide

This guide explains how to customize and maintain your portfolio website, update your photo albums, edit your biography, and manage your booking settings.

---

## 1. Quick File Map: Where Content Lives

All content is managed in simple, human-readable data files:

| Content Area | File / Folder |
|---|---|
| **Name, Bio, Tagline, Market** | `src/data/site-config.json` |
| **Photo Albums & Photograph Listings** | `src/data/albums.json` |
| **Local Images (Hero, Portrait, Covers)** | `public/images/` |

---

## 2. Personal Profile & Bio Configuration

Open `src/data/site-config.json` in any text editor:

### A. Name, Title & Market
```json
{
  "modelName": "Nancy Leone",
  "brandTagline": "Erotic Model",
  "brandSubtitle": "Denver",
  "locationBase": "Denver, Colorado",
  "statusBadge": "Amateur Model"
}
```

### B. Headline & Supporting Copy
```json
"hero": {
  "badge": "Amateur Model • Denver",
  "headline": "Aspiring for the Spotlight. Born to Stand Out.",
  "subheadline": "Meet Nancy Leone — an aspiring model from Denver with a bold personality, a playful spirit, and ambitions of becoming a household name.",
  "ctaText": "Explore Portfolio",
  "secondaryCtaText": "About Nancy",
  "backgroundImage": "/images/hero/hero-main.png"
}
```

### C. Biography
```json
"about": {
  "label": "About Nancy Leone",
  "heading": "Ready to Bring Energy, Style, and Bold Personality",
  "portraitImage": "/images/hero/about-portrait.png",
  "biography": [
    "Nancy Leone is an amateur model from Denver with big dreams and a distinctive personality.",
    "With her sights set on international recognition and the ambition to grace the cover of Playboy, Nancy is ready to bring her own energy and style to the world of modeling."
  ]
}
```

### D. Contact Information (Private Reference)
Per client request, the public Contact Us section and booking form have been removed entirely from the website to keep the focus purely on Nancy's editorial imagery and bio.

Her contact details are preserved here in private project documentation for future reference:
- **Client Email**: `nancyloveleone@gmail.com`
- **Location**: Denver, Colorado


---

## 3. Photo Albums & TurboImageHost Management

Your website is currently configured with three verified collections:
1. **Nancy Leone Debut Photoshoot** (77 verified photographs)
2. **Nancy Leone Showing it like Greek Goddess** (89 verified photographs)
3. **Nancy Leone in Green Saree** (61 verified photographs)


### Adding a New Album from TurboImageHost
To import an additional photoshoot album:
```bash
npm run import:album "https://www.turboimagehost.com/album/4126XX/album_name" -- --slug "new-photoshoot" --title "Photoshoot Title" --category "Editorial"
```

### Adding Photos Manually (Drag & Drop)
1. Create a folder in `public/images/albums/[album-name]/`.
2. Add your images (`cover.png`, `01.png`, `02.png`, etc.).
3. Run:
   ```bash
   npm run scan:albums
   ```
   *The system automatically scans and registers your new photos in `src/data/albums.json`!*

---

## 4. Local Preview

Start your local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Any edits to `site-config.json` or `albums.json` update automatically.

---

## 5. Vercel Hosting & Deployment

The website is fully configured with `vercel.json` for 1-click deployment:
1. Connect your repository to [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**. Your portfolio is live with global CDN and SSL.
