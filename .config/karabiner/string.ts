import { LayerCommand } from './types'

declare global {
  interface String {
    get app(): LayerCommand
    get open(): LayerCommand
    get toggle(): LayerCommand
    get variable(): string
  }
}

Object.defineProperties(
  String.prototype, {
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

    app: {
      get: function() {
        return `-a '${this}.app'`.open
      },
    },

    toggle: {
      get: function() {
        return {
          description: `Toggle ${this}`,
          to: [{
            shell_command: `osascript \
              -e 'tell application "System Events" to set _app to name of first process whose frontmost is true' \
              -e 'if _app is "${this}" then' \
              -e '  tell application "System Events" to set visible of process "${this}" to false' \
              -e 'else' \
              -e '  tell application "${this}" to activate' \
              -e 'end if \
            '`,
          }],
        }
      },
    },

    variable: {
      get: function() {
        return `hyper_sublayer_${this}`
      },
    },
  },
)
