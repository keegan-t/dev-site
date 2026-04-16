# <img src="public/favicon.svg" width="40" align="center" alt="Wordle Logo"> keegant.dev

Personal portfolio website built with [Astro](https://astro.build) 🚀

## Stack

- **Framework** - Astro 4 (SSR via Node adapter)
- **Styling** - Pure CSS with custom properties
- **Fonts** - Outfit (headings), Inter (body) via Google Fonts
- **Icons** - Devicon CDN for tech stack logos
- **Deployment** - DigitalOcean VPS, nginx reverse proxy, PM2, GitHub Actions

## Structure

```
src/
  components/     # Reusable site components
  data/           # JSON files for dynamic rendering
  layouts/        # Base site layout
  pages/          # Astro page files
  styles/         # Global styling
public/           # Static assets (images, audio)
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
