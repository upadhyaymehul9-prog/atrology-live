# Yoga Jyotish — Vedic Yoga & Dosha Finder

A **mobile-first Progressive Web App (PWA)** to manage clients, detect Vedic yogas/doshas from birth details, filter people by yoga type, and send **WhatsApp reminders** — with **all data stored locally on the phone** (no server, no database, 100% free).

## Features

- **15+ Yogas & Doshas**: Kal Sarpa, Pitru Dosh, Grahan Dosh, Chandal Yog, Mangal Dosh, Kemadruma, Vish Yog, Shrapit Yog, Angarak Yog, Gand Mool, and more
- **Filter by yoga**: See only people who have a specific dosh/yoga
- **WhatsApp integration**: One-tap reminder with pre-written message (uses `wa.me` — no API cost)
- **Bulk reminders**: Select multiple people and remind them sequentially
- **Local storage only**: Data never leaves the device
- **Backup/Restore**: Export/import JSON backup
- **Installable PWA**: Add to home screen on Android/iPhone
- **Free deployment**: GitHub Pages (static hosting)

## Quick Start (Development)

```bash
npm install
npm run dev
```

Open http://localhost:5173 on your phone or browser.

## Deploy Free on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Build and deployment**
3. Set source to **GitHub Actions**
4. Push to `main` — the workflow deploys automatically

Your app will be live at: `https://<username>.github.io/<repo-name>/`

## How to Use

1. **Install on phone**: Open the deployed URL → "Add to Home Screen"
2. **Add yajmaan**: Name, WhatsApp number (with country code e.g. `919876543210`), birth date, birth time, birth place
3. **View yogas**: App auto-calculates all yogas using Lahiri ayanamsa
4. **Filter**: Use dropdown to filter e.g. only Kal Sarpa Yoga people
5. **WhatsApp remind**: Tap green button to open WhatsApp with a personalized yoga message

## Data Privacy

- All person data is stored in **browser localStorage** on your device
- No backend, no cloud sync, no tracking
- Use Backup/Restore to transfer data between devices manually

## Supported Yogas

| Yoga/Dosh | Hindi |
|-----------|-------|
| Kal Sarpa Yoga | कालसर्प योग |
| Pitru Dosh | पितृ दोष |
| Grahan Dosh | ग्रहण दोष |
| Chandal Yoga | चांडाल योग |
| Mangal Dosh | मंगल दोष |
| Kemadruma Yoga | केमद्रुम योग |
| Vish Yoga | विष योग |
| Shrapit Yoga | श्रापित योग |
| Angarak Yoga | अंगारक योग |
| Sarp Dosh | सर्प दोष |
| Chandra Dosh | चंद्र दोष |
| Surya Dosh | सूर्य दोष |
| Paap Kartari Yoga | पाप कर्तरी योग |
| Gand Mool | गंड मूल |
| Guru Chandal Yoga | गुरु चांडाल योग |

## Tech Stack

- React + TypeScript + Vite
- astronomy-engine (planetary positions)
- vite-plugin-pwa (offline + installable)
- GitHub Pages (free hosting)

## Disclaimer

This app provides automated yoga detection for awareness purposes. For important life decisions, consult a qualified Vedic astrologer (Jyotishi).
