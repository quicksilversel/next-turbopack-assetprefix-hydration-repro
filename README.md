# Turbopack + cross-origin `assetPrefix` → Pages Router never hydrates

A minimal Next.js **Pages Router** app whose production **Turbopack** build fails
to hydrate when `_next/static` is served from a **cross-origin CDN** via
`assetPrefix`. The **webpack** build, and the **same Turbopack build served
same-origin**, both hydrate correctly.

## Versions

- next `16.4.1`
- react / react-dom `19.2.0`
- Reproduces in Chrome (latest). Router: **Pages**. Bundler: **Turbopack** (default).

## What you should see

| Build | Static served from | Result |
| --- | --- | --- |
| Turbopack (`next build`) | **cross-origin CDN** (`assetPrefix`) | ❌ never hydrates |
| Turbopack (`next build`) | same-origin (no `assetPrefix`) | ✅ hydrates |
| webpack (`next build --webpack`) | **cross-origin CDN** (`assetPrefix`) | ✅ hydrates |

"Hydrated" = heading turns green, the button alerts on click, and the console
logs `[repro] React hydrated`. On the failing case the server-rendered HTML
shows but none of that happens, and **every `_next/static` chunk still returns
200** — there is no network error.

## Reproduce

jsDelivr serves this public repo's files at
`https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@<ref>/<path>`.

### 1. Install

```bash
npm install
```

### 2. Build with the CDN assetPrefix (Turbopack, the default)

```bash
CDN_URL=https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@main npm run build
```

### 3. Publish `_next/static` to the CDN

Next serves chunks at `/_next/static/...`, but the build dir is `.next/static`,
so copy the static assets to `_next/static` at the repo root (that's what
jsDelivr will serve). Then commit and push:

```bash
rm -rf _next && cp -r .next/static _next/static
git add -A
git commit -m "repro build"
git push
```

jsDelivr will then serve, e.g.
`https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@main/_next/static/chunks/<hash>.js`.
(First request warms the cache. If you rebuild, push again and bump the ref or
use the commit SHA instead of `@main` to avoid stale caching.)

### 4. Start the server with the same assetPrefix and open it

```bash
CDN_URL=https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@main npm start
```

Open http://localhost:3000 in Chrome. **Observed:** heading stays red, button
does nothing, console never logs `[repro] React hydrated`. DevTools → Network
shows all `cdn.jsdelivr.net/.../_next/static/...` chunks returning **200**.

## Controls (both hydrate)

**Same build, served same-origin** — just omit `CDN_URL`:

```bash
npm start
# open http://localhost:3000 → ✅ hydrates (chunks served from localhost)
```

**webpack build through the same CDN:**

```bash
CDN_URL=https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@main npm run build:webpack
# commit & push .next/static, then:
CDN_URL=https://cdn.jsdelivr.net/gh/quicksilversel/next-turbopack-assetprefix-hydration-repro@main npm start
# open http://localhost:3000 → ✅ hydrates
```

## Expected vs actual

- **Expected:** a Turbopack production build hydrates regardless of whether
  `_next/static` is same-origin or served from a cross-origin `assetPrefix` CDN
  (webpack does).
- **Actual:** with Turbopack + a cross-origin `assetPrefix` CDN, the page
  registers its SSR HTML but React never hydrates, even though all chunks load
  (HTTP 200). `crossOrigin: 'anonymous'` (set in `next.config.ts`) does not help.
