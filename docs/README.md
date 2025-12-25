# Experience SDK Documentation

This is the documentation site for the Experience SDK, built with [Nextra](https://nextra.site/).

## Development

```bash
# From root of monorepo
pnpm docs:dev
```

Visit http://localhost:3000

## Building

### Build everything (SDK + docs)
```bash
# From root of monorepo
pnpm build:docs
```

### Build only docs (faster if SDK already built)
```bash
# From root of monorepo
pnpm --filter docs build
```

The site will be built to `docs/out/` directory (static export).

## Deployment

### GitHub Pages (Automatic)

The docs are automatically deployed to GitHub Pages on every push to `main` that affects:
- `docs/**`
- `packages/**` (SDK changes)
- `.github/workflows/docs.yml`

**Setup:**
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to main → site deploys automatically

**URL:** `https://prosdevlab.github.io/experience-sdk/`

### Vercel (Manual)

1. Install Vercel CLI: `npm i -g vercel`
2. From the `docs/` directory, run: `vercel`
3. Follow the prompts
4. The site will be deployed automatically

The `vercel.json` config handles the monorepo build process.

### Cloudflare Pages

1. Connect your GitHub repository
2. Set build command: `pnpm install && pnpm build:docs`
3. Set output directory: `docs/out`
4. Deploy

## Manual Build & Deploy

```bash
# Build docs
pnpm build:docs

# Output is in docs/out/
# Serve it with any static file server:
npx serve docs/out
```

## Structure

```
docs/
├── pages/              # MDX pages
│   ├── index.mdx      # Homepage
│   ├── getting-started.mdx
│   ├── demo/          # Interactive demos
│   │   ├── index.mdx  # Demo overview
│   │   └── banner.mdx # Banner demo
│   └── api/           # API reference
├── components/         # React components
│   ├── ExperienceDemo.tsx (old)
│   └── BannerDemo.tsx # Banner demo component
├── public/            # Static files
│   └── sdk/          # SDK bundle (auto-generated)
├── out/              # Build output (gitignored)
├── theme.config.tsx   # Nextra theme config
└── next.config.js     # Next.js config
```

## SDK Bundle

The SDK is automatically copied to `public/sdk/` during the build process via the `prebuild` script in `package.json`. This allows:

1. Script tag demos to load the SDK from `/sdk/index.global.js`
2. Both npm and CDN usage examples
3. Interactive demos to work without external dependencies

The prebuild script runs:
```bash
pnpm --filter @prosdevlab/experience-sdk build && \
  mkdir -p public/sdk && \
  cp -r ../packages/core/dist/* public/sdk/
```

