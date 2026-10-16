# Turbopack ignores a runtime `assetPrefix` → Pages Router never hydrates

A minimal Next.js **Pages Router** app that **does not hydrate** when the
production **Turbopack** build is run with an `assetPrefix` (cross-origin CDN)
that was **not set at build time**. The **webpack** build hydrates correctly, and
so does a Turbopack build where the same `assetPrefix` **was** set at build time.

## Summary

`assetPrefix` is read from `process.env.CDN_URL` in `next.config.ts`.

| Build | Run | Result |
| --- | --- | --- |
| Turbopack, **no** `CDN_URL` (empty prefix) | **with** cross-origin `CDN_URL` | ❌ never hydrates |
| Turbopack, **with** `CDN_URL` (prefix baked) | with the same `CDN_URL` | ✅ hydrates |
| **webpack**, **no** `CDN_URL` | **with** cross-origin `CDN_URL` | ✅ hydrates |

In the failing case **every chunk still loads (HTTP 200) with no console or CORS
errors** — the SSR HTML renders but React never attaches (`#__next` gets no React
root, `useEffect` never runs, buttons are dead).

The takeaway: **Turbopack bakes the build-time `assetPrefix` into the client
runtime and ignores a value supplied only at runtime**, so chunk loading / the
hydration bootstrap breaks when the runtime `assetPrefix` differs from the
build-time one. Webpack honors the runtime value.

This matters for any setup that builds an image once and injects the CDN
`assetPrefix` at deploy time (e.g. a Docker image whose `assetPrefix` comes from a
Kubernetes env var).

## Versions

- next `16.4.1`, react / react-dom `19.2.0`
- Reproduced in Chrome. Router: **Pages**. Default bundler: **Turbopack**.

## Reproduce

Two origins are needed so chunks load cross-origin: the app on `localhost:3000`,
and `cdn-server.mjs` serving `.next/static` on `127.0.0.1:4000`.

```bash
npm install

# 1. Build WITHOUT CDN_URL (assetPrefix is empty/baked-empty)
npm run build

# 2. In terminal A: serve the built chunks from a second origin
npm run cdn            # http://127.0.0.1:4000

# 3. In terminal B: run the app WITH a cross-origin assetPrefix at runtime
CDN_URL=http://127.0.0.1:4000 npm start   # http://localhost:3000
```

Open http://localhost:3000 in Chrome. **Observed:** the heading stays red
("⏳ Not hydrated"), the button does nothing, and the console never logs
`[repro] React hydrated`. DevTools → Network shows every
`127.0.0.1:4000/_next/static/...` chunk returning **200**.

## Controls (both hydrate)

**webpack build**, same runtime `assetPrefix`:

```bash
npm run build:webpack
npm run cdn
CDN_URL=http://127.0.0.1:4000 npm start   # ✅ hydrates
```

**Turbopack build with the `assetPrefix` baked at build time:**

```bash
CDN_URL=http://127.0.0.1:4000 npm run build
npm run cdn
CDN_URL=http://127.0.0.1:4000 npm start   # ✅ hydrates
```

## Expected vs actual

- **Expected:** a Turbopack production build hydrates when `assetPrefix` is
  supplied at runtime (as webpack does), or Next documents that `assetPrefix`
  must be fixed at build time.
- **Actual:** with Turbopack, an `assetPrefix` set only at runtime (different
  from build time) leaves the page server-rendered but **never hydrated**, even
  though all chunks load with HTTP 200 and no errors.
