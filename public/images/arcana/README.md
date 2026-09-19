# Home hero photographic asset

`home-hero.jpg` is the approved cinematic Home reference (real photographic Tarot-table composition), used two ways in `src/styles.css`:

- As the sharp, aspect-ratio-locked centerpiece (`.hero-photo img`), sized to the card's native 1024×1536 ratio so the baked-in composition (wordmark, cards, CTA graphic) never distorts.
- As a full-bleed, heavily blurred/darkened backdrop (`.hero::before`) so wide viewports don't show empty black gutters beside the portrait-shaped centerpiece.

The real, functional `.hero-cta` button is absolutely positioned over the image at `top:71.4%` to align with the "BEGIN YOUR JOURNEY" graphic baked into the photo.
