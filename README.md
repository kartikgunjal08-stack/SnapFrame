# SnapFrame — Screenshot & Device Mockup Studio

A production-ready, 100% browser-based screenshot beautifier, 3D device mockup studio, and launch graphic builder built with React, TypeScript, and Tailwind CSS.

Designed for zero server costs ($0 static hosting on Vercel, Netlify, or Cloudflare Pages) and clean white-label customization so the owner controls branding and monetization.

---

## Features
- **Click-to-Edit Directly on Canvas (No Screenshot Required):** Click any text, brand name, KPI metric, window title, URL, headline, or chart right on the mockup stage to edit it inline — or paste (`Ctrl+V` / `Cmd+V`) / drag-and-drop any screenshot.
- **7 Device & Window Frames:** Frameless card, macOS Dark, macOS Light (editable window title), Browser Address Bar (editable URL), Titanium iPhone Bezel, Landscape Tablet Bezel, and Frosted Glass Frame.
- **Background & Pattern Studio:** 28 curated mesh gradients, custom solid color picker, custom background image upload, 5 backdrop patterns (None, Dots, Grid, Spotlight Glow, Concentric Rings), and adjustable film grain texture.
- **152 Ready-to-Use Templates:** Searchable, categorized library covering Launch, AI & Agents, E-Commerce, Social, Mobile, Engineering, Editorial, and Marketing layouts.
- **3D Perspective & Geometry:** Padding, corner radius, frame scale, 4 shadow depths, and interactive X/Y/Z 3D tilt & roll controls.
- **Social Aspect Ratios & Captions:** One-click sizing for `Auto`, `16:9` (X/YouTube), `16:10` (Product Hunt), `4:5` (LinkedIn), and `1:1` (Square), plus optional top/bottom eyebrow, title, and subtitle overlays.
- **Clean High-DPI Export:** Unlocked `1x`, `2x`, and `3x` PNG/JPEG downloads plus 1-click clipboard image copy with zero watermarks.

---

## White-Label Customization

Core branding and optional sidebar sponsor settings live in **`src/config.ts`**:

1. **Rebrand the App:** Update `appName`, `domainLabel`, `defaultBrowserUrl`, and `defaultWindowTitle` in `src/config.ts`, plus `<title>` and `<meta>` tags in `index.html` and `metadata.json`.
2. **Optional Sponsor Card:** Set `sponsorSlot.enabled = true` in `src/config.ts` and fill in `name`, `description`, and `url` to display a native sponsor card in the sidebar.
3. **Custom Monetization:** Because the codebase is clean and unencumbered, the buyer can freely add their own auth, paywall, or AdSense scripts if desired.

---

## Local Development & Free Deployment

```bash
npm install
npm run dev
```

Build for production (`dist/`):

```bash
npm run build
```

Deploy to **Vercel**, **Netlify**, or **Cloudflare Pages** as a standard Vite static site (`npm run build` -> `dist`). Zero backend databases or environment variables required.
