# Aashirwad Institute — About Page

## How to open
Unzip, then open `index.html` in any modern browser. No build step, no install — it just runs.
(For the horizontal-scroll and pinned sections to behave exactly like a real server, you can optionally serve the folder — e.g. `python3 -m http.server` — and visit `http://localhost:8000`, but opening the file directly also works.)

## What's inside
- `index.html` — all ten sections of content, in order, unedited from what you provided.
- `css/style.css` — all layout, type and color styling.
- `js/script.js` — every scroll animation (GSAP + ScrollTrigger, loaded from a CDN, so you need an internet connection the first time each visitor loads the page).

## The animations, section by section
1. **Hero** — the book-cover opening (kept from before, intentionally the simplest moment), then a parallax portrait behind the title.
2. **Our journey** — pinned section; an SVG line draws itself and three milestone cards appear as you scroll.
3. **Excellence in Competitive Examinations** — orbiting badge ring with statistics that count up (27 First Ranks, etc.).
4. **Educational Ecosystem** — pinned section that turns vertical scrolling into a horizontal scroll through all 11 programmes.
5. **CSNP** — pinned; the portrait straightens out of a 3D tilt while four stage panels change underneath it.
6. **Innovation in Education** — a 3D device mockup with floating labels (Rank File, EduVerse, etc.) moving at different parallax speeds.
7. **Learning Beyond the Classroom** — a circular mask expands into a full-bleed photograph as you scroll.
8. **Our Commitment to Results** — three stacked cards physically separate and fan out, ending on the KTET Success Guarantee.
9. **Vision & Mission** — a split-screen panel that widens and narrows between the two statements.
10. **Closing** — the institute mark with soft floating particles.

## Replacing the placeholder images
Every image is a temporary stock photo from Unsplash (chosen to match each section's theme), with an automatic fallback so nothing ever shows a broken-image icon. To swap in the institute's real photography, replace the `src="..."` value on each `<img>` tag in `index.html` with your own image path (e.g. `images/campus-01.jpg`), and add your image files anywhere in the project folder.

## Accessibility
Reduced-motion is respected — visitors with that OS setting see the full content instantly, without the pinned/scroll-scrubbed animations. Keyboard focus states are visible, and colour contrast follows WCAG AA on all text.
