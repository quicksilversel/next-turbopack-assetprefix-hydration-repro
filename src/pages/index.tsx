import { useEffect, useState } from 'react'

import type { InferGetServerSidePropsType } from 'next'

/**
 * getServerSideProps forces SSR (dynamic), matching a real Pages Router app
 * rather than a static export.
 */
export const getServerSideProps = async () => {
  return { props: { renderedAt: new Date().toISOString() } }
}

export default function Home({
  renderedAt,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // If this runs, React hydrated. With the Turbopack build served from a
    // cross-origin assetPrefix CDN, it never runs.
    // eslint-disable-next-line no-console
    console.log('[repro] React hydrated')
    setHydrated(true)
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 40, lineHeight: 1.6 }}>
      <h1 style={{ color: hydrated ? 'green' : 'crimson' }}>
        {hydrated ? '✅ Hydrated' : '⏳ Not hydrated (SSR HTML only)'}
      </h1>
      <p>Server-rendered at: {renderedAt}</p>
      <button type="button" onClick={() => alert('clicked — client JS works')}>
        Click me
      </button>
      <p>
        If the heading stays red, the button does nothing, and the console never
        logs <code>[repro] React hydrated</code>, hydration failed.
      </p>
    </main>
  )
}
