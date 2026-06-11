import { render, type RenderOptions } from '@builder.io/qwik'
import HTML from './root'

export default function(opts: RenderOptions) {
  return render(document, <HTML />, opts)
}
