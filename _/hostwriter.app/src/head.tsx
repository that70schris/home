import {
  ServiceWorkerRegister,
  useDocumentHead,
  useLocation,
} from '@builder.io/qwik-city'

import { component$ } from '@builder.io/qwik'

export const Head = component$(() => {
  const head = useDocumentHead()
  const loc = useLocation()
  return (
    <head>
      <title>{head.title}</title>

      <meta charset="utf-8" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="canonical" href={loc.url.href} />
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👻</text></svg>" />

      {head.meta.map(m => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map(l => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map(s => (
        <style key={s.key} {...s.props} dangerouslySetInnerHTML={s.style} />
      ))}

      {head.scripts.map(s => (
        <script key={s.key} {...s.props} dangerouslySetInnerHTML={s.script} />
      ))}

      <ServiceWorkerRegister />
    </head>
  )
})
