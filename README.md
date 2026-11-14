# SnapFrame — Screenshot & Device Mockup Studio

A production-ready, 100% browser-based screenshot beautifier, 3D device mockup studio, and launch graphic builder built with React, TypeScript, and Tailwind CSS.

Designed for zero server costs ($0 static hosting on Vercel, Netlify, or Cloudflare Pages) and clean white-label customization so the owner controls branding and monetization.

---

## Features
- **Instant Media Input:** Drag-and-drop image upload, file picker, `Ctrl+V` / `Cmd+V` clipboard paste, plus 3 built-in vector sample mockups (SaaS, Mobile, Code).
- **Device & Window Frames:** Frameless card, macOS Dark, macOS Light (editable window title), Browser Address Bar (editable URL), and Titanium iPhone Bezel with Dynamic Island.
- **Background Studio:** 24 curated mesh gradients, custom solid color picker, custom background image upload, and adjustable film grain texture.
- **112 Ready-to-Use Templates:** Searchable, categorized library covering Launch, Social, Mobile, Engineering, Editorial, and Marketing layouts.
- **3D Perspective & Geometry:** Padding, corner radius, frame scale, 4 shadow depths, and interactive X/Y 3D tilt controls.
- **Social Aspect Ratios & Captions:** One-click sizing for `Auto`, `16:9` (X/YouTube), `16:10` (Product Hunt), `4:5` (LinkedIn), and `1:1` (Square), plus optional top/bottom launch headlines.
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
