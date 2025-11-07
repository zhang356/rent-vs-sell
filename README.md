# Rent vs Sell — Investment Return Calculator (Preact + Vite)

A clean Preact single-page app to compare **Hold & Rent** vs **Sell & Invest** over a chosen time horizon. 
Includes a language switcher (English/中文), interactive chart, year-by-year table, URL sharing, and CSV export.

## Quick start

```bash
# 1) Install deps
npm i

# 2) Run locally
npm run dev

# 3) Build
npm run build
# Built files go to ./dist
```

## Deploy to GitHub Pages

Option A — push the `dist` folder to a `gh-pages` branch automatically:

```bash
npm run build
npm run deploy
```

The script uses the `gh-pages` package to publish `dist/` to a `gh-pages` branch. In your repository settings, set Pages to serve from that branch.

Option B — classic manual:

- Build with `npm run build`
- Create a new branch named `gh-pages`, copy the contents of `dist/` into it, and push.
- In the repository **Settings → Pages**, select **Branch: gh-pages**.

> We set `base: './'` in `vite.config.ts` so relative paths work correctly when served from Pages.

## Edit points

- All UI strings are in `src/ui/i18n.ts` (English & Chinese). Add more languages here easily.
- Main UI & logic live in `src/ui/App.tsx`.
- Styles are in `src/ui/styles.css`.
- The growth math is in `rowsFromState()` (inside `App.tsx`).

## Notes

- This is a simplified model; it doesn’t include taxes or mortgages yet. Extend the state shape and add inputs as needed.
- Charting is via `chart.js`. If you prefer ECharts or Recharts, swap the `ProjectionChart` component.