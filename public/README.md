# ARCANA card assets

This directory (`public/deck/`) holds all 78 card images, served locally by `cardImageUrl()` in `src/data/cards.js` (`/public/deck/{imageCode}.jpg`). The app does not depend on any third-party image host at runtime.

The previous remote-hotlinking approach (`petaloverflow.github.io`) was found to be completely offline (404 / GitHub Pages "site not found") during UI verification, so the deck is now bundled locally by default.

To (re)download the deck from source — e.g. after a fresh clone where `public/deck/` is empty:

```bash
node scripts/download-deck.mjs
```

This resolves and downloads the 1909 Pamela Colman Smith / Rider-Waite-Smith deck from Wikimedia Commons (public domain in the US, `Category:Rider-Waite-Smith tarot deck (TaionWC)`), which hosts a complete, consistently-named 78-file set (`RWS Tarot 00 Fool.jpg` … `RWS Tarot 21 World.jpg` for the Majors; `Wands01.jpg`…`Wands14.jpg`, `Cups01.jpg`…`Cups14.jpg`, `Swords01.jpg`…`Swords14.jpg`, `Pents01.jpg`…`Pents14.jpg` for the Minors). The script resumes safely — it skips any `{imageCode}.jpg` already present — and caches the resolved Commons URLs in `scripts/.urlmap-cache.json` since the lookup API is rate-limited and the file URLs are stable.

The original 1909 Rider-Waite-Smith artwork is public domain; verify each asset's status for your jurisdiction and distribution model before commercial deployment. Do not substitute a copyrighted modern recolor/reprint edition without checking its license.
