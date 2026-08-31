# knuckls.com — HOME LAB Page for ELEMENTOR (basic, copy-paste per widget)

SETUP ONCE:
- Page background = #0d1117, text = #e6edf3. Headings = Rajdhani, body = Inter.
- Code/lists in JetBrains Mono where noted. Amber #ffb000 for section accents.

================================================================

WIDGET 1 — TYPE: Heading
Text: The Home Lab

WIDGET 2 — TYPE: Text Editor
Text:
This is where the magic (and the heat) happens. Everything you connect to on the Servers page runs from right here — plus this site's live status feed. Half battle-station, half science project.

================================================================

WIDGET 3 — TYPE: Heading
Text: Hardware

WIDGET 4 — TYPE: Text Editor  (fill your real specs; JetBrains Mono or bullet list)
Text:
- CPU: [e.g. Intel i5 / Ryzen 5]
- RAM: [e.g. 32 GB]
- Storage: [e.g. 2x 1TB NVMe + 4TB HDD]
- Network: [e.g. pfSense box, 1 Gbps]
- Misc: [e.g. UPS, switch, old laptop as backup]

================================================================

WIDGET 5 — TYPE: Heading
Text: Software stack

WIDGET 6 — TYPE: Text Editor
Text:
- Hypervisor: [e.g. Proxmox]
- Containers: [e.g. Docker / Portainer]
- Router/Firewall: [e.g. pfSense]
- Game servers: [e.g. LinuxGSM for FiveM/DayZ]
- Media: [e.g. Plex / Jellyfin]
- Monitoring: [e.g. Uptime Kuma -> feeds the status widget]
- Backup: [e.g. hourly snapshots]

================================================================

WIDGET 7 — TYPE: Heading
Text: What it powers

WIDGET 8 — TYPE: Text Editor
Text:
- All game servers listed on /servers
- This site's live status feed
- [e.g. Plex for the crew]
- [e.g. File storage / backups]
- [e.g. Test bench for new game builds]

================================================================

WIDGET 9 — TYPE: Heading
Text: Network map

WIDGET 10 — TYPE: Image
- Upload the network diagram PNG (generated in Step 6 — I'll make this for you).
- Caption: "How the lab talks to the internet and the servers."

WIDGET 11 — TYPE: Text Editor (alt if no diagram yet)
Text:
[Diagram coming soon — modem -> pfSense -> switch -> Proxmox node -> game-server VMs]

================================================================

WIDGET 12 — TYPE: Button
Text: See what's running
Link: [your-site]/servers

WIDGET 13 — TYPE: Button
Text: Follow the build logs
Link: [your-site]/logs
