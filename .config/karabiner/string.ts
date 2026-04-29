import { LayerCommand } from './types'

declare global {
  interface String {
    get app(): LayerCommand
    get open(): LayerCommand
    get flag(): string
  }
}

Object.defineProperties(
  String.prototype, {
    app: {
      get: function() {
        return `-a '${this}'`.open
      },
    },

    open: {
      get: function() {
        return {
          description: `Open ${this}`,
          to: [
            {
              shell_command: `open ${this}`,

            },
          ],
        }
      },
    },

    flag: {
      get: function() {
        return `hyper_sublayer_${this}`
      },
    },
  },
)
