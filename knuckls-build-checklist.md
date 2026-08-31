# knuckls.com — BUILD CHECKLIST (Hostinger WordPress + Elementor)

Unzip knuckls-website-bundle.zip first. Log into knuckls.com/wp-admin.

## ☐ STEP 1 — Install Elementor + theme
- [ ] Plugins → Add New → search "Elementor" → Install → Activate
- [ ] Appearance → Themes → Add New → "Astra" or "Kadence" → Install → Activate
- [ ] (opt) Plugins → Rank Math SEO + Smush

## ☐ STEP 2 — Colors & fonts (once)
- [ ] Elementor (☰) → Site Settings → Theme Style
- [ ] Colors: text #e6edf3, bg #0d1117, sections #161b22
- [ ] Fonts: Headings = Rajdhani, Body = Inter
- [ ] Save

## ☐ STEP 3 — Upload media
- [ ] Media → Add New → upload 3 logos + knuckls-lab-network.png (+ -transparent)
- [ ] fist = favicon/avatar, wordmark = header, brass-K = hero/footer, network png = Lab

## ☐ STEP 4 — Favicon + header
- [ ] Appearance → Customize → Site Identity → Site Icon = fist badge → Publish
- [ ] Header builder → Image = wordmark → Publish

## ☐ STEP 5 — HOME page
- [ ] Pages → Add New → "Home" → Edit with Elementor
- [ ] Section bg = #0d1117
- [ ] For each WIDGET in knuckls-home-elementor.md: drag widget type, paste Text, set links/images
- [ ] Update
- [ ] Settings → Reading → static homepage = Home

## ☐ STEP 6 — Other pages (same method)
- [ ] Games  (knuckls-games-elementor.md)
- [ ] Servers (knuckls-servers-elementor.md)
- [ ] Lab  (knuckls-lab-elementor.md) + add network diagram Image
- [ ] Connect (knuckls-connect-elementor.md)

## ☐ STEP 7 — Logs (blog)
- [ ] Settings → Reading → Posts page = new "Logs" page
- [ ] Posts → Add New → use sample post in knuckls-logs-elementor.md, category "Logs"

## ☐ STEP 8 — Live status (optional)
- [ ] Servers page → HTML widget → paste knuckls-status/knuckls-status-widget.html
- [ ] Set STATUS_URL to your feed (follow knuckls-hpanel-dns-cheatsheet.md)
- [ ] OR skip: keep static 🟢/🔴 text, delete the HTML widget

## ☐ STEP 9 — Menu + live
- [ ] Appearance → Menus → Home · Games · Servers · Lab · Logs · Connect → Primary
- [ ] Visit knuckls.com — DONE

## 🔑 FILL THESE IN WORDPRESS (were [BRACKETS] in files)
- [ ] your name / location
- [ ] server names, IPs/connect lines, player counts
- [ ] Discord invite, Steam, socials, email
- [ ] (live) run knuckls_status.py on home lab + DNS steps
