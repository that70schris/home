import { component$, useStylesScoped$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import styles from './index.scss?inline'

export default component$(() => {
  useStylesScoped$(styles)
  return (
    <>
      <content>
        <div class="width">
          <img src="/list.png" class="window" alt="Host Writer editor window" />
          <h1>
            Manage your Mac's
            <code>/etc/hosts</code>
          </h1>
          <ul>
            <li>Create lists of host file entries</li>
            <li>Group lists together</li>
            <li>Drag and drop host entries, lists, and groups</li>
            <li>Undo/Redo</li>
            <li>Access lists and groups from the menu bar</li>
          </ul>
        </div>
      </content>
    </>
  )
})

export const head: DocumentHead = {
  title: 'Host Writer',
  meta: [
    {
      name: 'description',
      content: 'Host file manager for macOS',
    },
  ],
}
