# knuckls.com

Personal site for **Shaun (MrKnuckls)** — *"Gamer. Server host. Lab rat."*

Standalone static site. Upload the whole repo to Hostinger (or any static host) and it just works. No WordPress, no build tools.

## Live site

👉 **https://knuckls.com**

## What's here

| File | What |
|------|------|
| `index.html` | Main site — single page with all sections: About, Games, Servers, Projects, Lab, Connect |
| `assets/img/knuckls-fist-badge.png` | Favicon + social avatar |
| `assets/img/knuckls-wordmark.png` | Main wordmark banner |
| `assets/img/knuckls-brass-K.png` | Brand stamp (hero + footer) |
| `assets/knuckls-lab-network-transparent.png` | Home lab network diagram |
| `knuckls-brand-kit.md` | Full brand spec |
| `knuckls-hpanel-dns-cheatsheet.md` | Hostinger DNS setup |

## Brand

- **Palette — "Terminal":** `#0d1117` bg · `#161b22` surface · `#e6edf3` text · `#39d353` accent (neon green) · `#ffb000` secondary (amber)
- **Fonts (Google Fonts):** Rajdhani (headings) · Inter (body) · JetBrains Mono (code/stats)
- **Tagline:** *Gamer. Server host. Lab rat.*
- **Voice:** casual, first-person, gamer-native. Not corporate.

## Deploy to Hostinger

1. Clone or download this repo
2. Log into **hPanel → File Manager** or use FTP
3. Upload everything to `public_html/` (or the web root)
4. That's it — `index.html` loads automatically

Optional: point the domain, set up SSL (Hostinger does auto-SSL via Let's Encrypt).

## Build notes

- Single `index.html` with embedded CSS/JS — zero dependencies, works everywhere
- Matrix rain background canvas (lightweight, <2KB JS)
- Mobile responsive, smooth scroll, fade-in sections
- Google Fonts loaded from CDN