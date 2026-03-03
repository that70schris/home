import { component$ } from '@builder.io/qwik'
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city'

import './global.scss'
import { Head } from './head'

export default component$(() => {
  return (
    <QwikCityProvider>
      <Head />
      <body lang="en">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  )
})
