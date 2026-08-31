# knuckls.com

Personal site for **Shaun (MrKnuckls)** — *"Gamer. Server host. Lab rat."*

This repo is the source-of-truth asset bundle for the knuckls.com WordPress
(Hostinger + Elementor) build: brand kit, page content, logos, the home-lab
status server, and the network diagram.

> The site itself runs on Hostinger WordPress + Elementor. These files are the
> copy-paste content + assets that go *into* the WordPress editor — they are not
> a standalone static site.

## Brand at a glance

- **Palette — "Terminal"** (designed on GitHub's `#0d1117` bg):
  | Role | Hex |
  |------|-----|
  | Background | `#0d1117` |
  | Surface / cards | `#161b22` |
  | Text | `#e6edf3` |
  | Accent (online) | `#39d353` neon green |
  | Secondary (alerts) | `#ffb000` amber |
- **Fonts (Google Fonts):** Rajdhani (headings/logo) · Inter (body) · JetBrains Mono (code/lab stats)
- **Tagline:** *"Gamer. Server host. Lab rat."*
- **Voice:** casual, first-person, gamer-native. Operator/lab energy. Not corporate.

## Logo system (3 marks)

| File | Role |
|------|------|
| `knuckls-logos/knuckls-fist-badge.png` | Favicon + social avatar (Discord, Steam) — works at tiny sizes |
| `knuckls-logos/knuckls-wordmark.png` | Main site header banner (landscape) |
| `knuckls-logos/knuckls-brass-K.png` | Brand stamp on Home hero, footer, loading screen |

See [`knuckls-brand-kit.md`](knuckls-brand-kit.md) for the full spec.

## Repository layout

```
knuckls.com/
├── README.md                      ← you are here
├── knuckls-brand-kit.md          Brand spec (palette, fonts, logos, voice)
├── knuckls-build-checklist.md    Step-by-step WordPress/Elementor build
├── knuckls-hpanel-dns-cheatsheet.md  Hostinger hPanel DNS + status endpoint setup
│
├── Pages (Elementor widget copy)  ← paste into Elementor per the checklist
│   ├── knuckls-home-elementor.md
│   ├── knuckls-games-elementor.md
│   ├── knuckls-servers-elementor.md
│   ├── knuckls-lab-elementor.md
│   ├── knuckls-logs-elementor.md
│   └── knuckls-connect-elementor.md
├── Pages (plain markdown, human-readable)
│   ├── knuckls-home-page.md
│   └── knuckls-games-page.md
│
├── knuckls-logos/                Fist badge, wordmark, brass-K (PNG)
├── knuckls-lab-network.html      Interactive lab network diagram
├── knuckls-lab-network.png       Static render
├── knuckls-lab-network-transparent.png
│
└── knuckls-status/               Home-lab live status server
    ├── knuckls_status.py         Pure-stdlib Python status feed (:8080/status.json)
    └── knuckls-status-widget.html  Elementor HTML widget that reads the feed
```

## Building the site (short version)

1. Unzip the bundle, log into `knuckls.com/wp-admin`.
2. Install Elementor + Astra/Kadence (see `knuckls-build-checklist.md` STEP 1–2).
3. Set colors/fonts from the brand kit, upload the 3 logos (STEP 3–4).
4. For each page, open the matching `*-elementor.md` and paste its widgets into
   Elementor (STEP 5–6). Fill the `[BRACKET]` placeholders (name, server IPs,
   Discord/Steam, email) in the WordPress editor.
5. Menu → Home · Games · Servers · Lab · Logs · Connect. Done.

Full walkthrough with verification checks: [`knuckls-build-checklist.md`](knuckls-build-checklist.md).

## Live status server

`knuckls-status/knuckls_status.py` is a zero-dependency Python service that polls
your game servers and serves `http://0.0.0.0:8080/status.json` (CORS-enabled) so
the WordPress site can show live green/red dots + player counts.

DNS + HTTPS (Caddy/Let's Encrypt) setup for `status.knuckls.com` is in
[`knuckls-hpanel-dns-cheatsheet.md`](knuckls-hpanel-dns-cheatsheet.md). Browsers
block mixed content, so the endpoint must be HTTPS.

## License

Personal project. All rights reserved unless otherwise noted.
