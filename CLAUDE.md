# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Infinity Journal is a private, iPhone-first PWA — a personal infinite-scroll feed (like Instagram/X.com, but just for you) where you capture thoughts, save links with rich previews, and store images.

**Tech Stack:**
- **Vite** - Build tool and development server
- **React 19.1.0** - UI framework with TypeScript
- **TailwindCSS** - Styling (loaded via CDN)
- **IndexedDB** - Local-only storage via `idb` library
- **TypeScript** - Type safety with strict mode enabled

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

```
/
├── App.tsx                    # Layout shell, state coordination
├── index.tsx                  # React entry point + service worker registration
├── index.html                 # HTML with PWA meta tags, Tailwind CDN, import maps
├── types.ts                   # Post, LinkPreview, StoredImage interfaces
├── components/
│   ├── Feed.tsx               # Infinite scroll container with IntersectionObserver
│   ├── PostCard.tsx           # Single post display (text/image/link variants)
│   ├── ComposeBar.tsx         # Bottom-anchored quick compose with URL detection
│   └── EmptyState.tsx         # Empty feed placeholder
├── services/
│   ├── db.ts                  # IndexedDB CRUD via idb library
│   └── linkPreview.ts         # URL detection + Open Graph fetching
├── hooks/
│   └── usePosts.ts            # Custom hook: DB ops + pagination state
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (cache-first)
│   └── icons/                 # PWA icons (SVG)
└── vite.config.ts             # Vite config with path aliases
```

## Key Features

### Post Types
- **Text**: Quick thoughts, notes
- **Images**: Photos uploaded from camera/library, stored as Blobs in IndexedDB
- **Links**: URLs auto-detected in text, rich previews fetched via Open Graph

### Data Storage
- **IndexedDB** via `idb` library (not localStorage — supports large data)
- Database: `infinity-journal`, version 1
- Object stores: `posts` (indexed by `createdAt`) and `images` (Blob storage)
- All data is local-only, never leaves the device

### Link Previews
- URLs detected via regex in compose text
- Fetched through `allorigins.win` CORS proxy
- Open Graph meta tags parsed with DOMParser
- Fallback: raw URL displayed as clickable link

### PWA
- Installable from Safari to iPhone home screen
- Service worker provides offline support
- iOS-specific meta tags for standalone mode

## Development Guidelines

### Styling
- Use Tailwind utility classes (CDN-loaded with custom theme)
- Dark theme: `near-black` (#0D0D0D) bg, `card-bg` (#1A1A1A), `electric-blue` (#00FFFF) accent
- Mobile-first, max-w-lg centered feed
- Use `env(safe-area-inset-bottom)` for iPhone home indicator

### Adding Features
1. Update `Post` type in `types.ts` if new data fields needed
2. Update `services/db.ts` if schema changes (bump DB_VERSION)
3. Update `ComposeBar.tsx` for new input methods
4. Update `PostCard.tsx` for new display variants

### Storage
- Images are stored as Blobs (not base64) in a separate object store
- Posts reference images via `imageId`
- Object URLs created with `URL.createObjectURL()` must be revoked on unmount
