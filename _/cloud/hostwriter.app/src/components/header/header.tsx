import { component$, useStylesScoped$ } from '@builder.io/qwik'
import styles from './header.scss?inline'

export default component$(() => {
  useStylesScoped$(styles)
  return (
    <header>
      <div class="width">
        Host Writer
        <nav>
          <a href="mailto:chris@bailey.mx">Support</a>
        </nav>
        <div id="ghost">
          <img src="/gHost.png" class="icon" alt="gHost status bar menu icon" />
          <img
            src="/menu.png"
            class="menu"
            alt="gHost status bar menu dropdown"
            loading="lazy"
          />
        </div>
      </div>
    </header>
  )
})
