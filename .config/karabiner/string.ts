import { LayerCommand } from './types';

declare global {
  interface String {
    get app(): LayerCommand;
    get open(): LayerCommand;
    get variable(): string;
  }
}

Object.defineProperties(String.prototype, {
  open: {
    get: function () {
      return {
        description: `Open ${this}`,
        to: [
          {
            shell_command: `open ${this}`,
          },
        ],
      };
    },
  },

  app: {
    get: function () {
      return `-a '${this}.app'`.open;
    },
  },

  variable: {
    get: function () {
      return `hyper_sublayer_${this}`;
    },
  },
});
