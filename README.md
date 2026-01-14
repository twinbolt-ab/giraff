<p align="center">
  <img src="public/icon.png" alt="Stuga" width="120" height="120">
</p>

<h1 align="center">Stuga</h1>

<p align="center">
  <strong>A beautiful, opinionated Home Assistant dashboard</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Home%20Assistant-2024.1+-41BDF5?logo=home-assistant&logoColor=white" alt="Home Assistant">
  <img src="https://img.shields.io/badge/iOS-17+-000000?logo=apple&logoColor=white" alt="iOS">
  <img src="https://img.shields.io/badge/Android-14+-3DDC84?logo=android&logoColor=white" alt="Android">
  <img src="https://img.shields.io/badge/license-ELv2-blue" alt="License">
</p>

---

I love Home Assistant. I don't love configuring dashboards.

Stuga is what I wanted: a fast, polished app that just works. Open it, log in, done. Your rooms, devices, and floors are already there. No YAML. No cards. No templates.

Built for my family to actually use.

---

## What it does

- **Zero config** — Reads your HA setup automatically
- **In-place editing** — Rename rooms, change icons, reorder things. All saved back to HA.
- **Mobile-first** — Designed for phones. Works on tablets and web too.
- **Fast** — WebSocket connection, instant updates

https://github.com/twinbolt-ab/stuga/raw/main/public/stuga-demo.mp4

---

## Install

### iOS & Android

Coming soon to App Store and Google Play. Free.

### Home Assistant Add-on

1. **Settings → Add-ons → Add-on Store**
2. Click ⋮ → **Repositories** → Add: `https://github.com/twinbolt-ab/stuga`
3. Find "Stuga Dashboard" → **Install**
4. Open `http://homeassistant.local:3001`

### Docker

```bash
docker run -d -p 3001:3001 ghcr.io/twinbolt-ab/stuga:latest
```

<details>
<summary>Docker Compose</summary>

```yaml
services:
  stuga:
    image: ghcr.io/twinbolt-ab/stuga:latest
    ports:
      - "3001:3001"
    restart: unless-stopped
```

</details>

---

## Supports

Lights, switches, scenes, climate, covers, fans. More coming.

---

## Development

```bash
npm install
npm run dev
```

Built with Vite, React, Tailwind, Framer Motion, and Capacitor.

---

## Roadmap

**Now:** Polish, stability, community feedback

**Later:** Widgets, Apple Watch, themes, multi-instance support

---

## License

[Elastic License 2.0](LICENSE) — Free for personal use. Can't be offered as a hosted service.

---

<p align="center">
  Made by <a href="https://twinbolt.se">Twinbolt</a> in Sweden
</p>
