import './string';
import {
  HyperKeySublayer,
  KarabinerRule,
  KeyCode,
  LayerCommand,
  Manipulator,
} from './types';

declare global {
  interface Object {
    get sublayers(): KarabinerRule[]
  }
}

Object.defineProperties(
  Object.prototype satisfies {
    [key_code in KeyCode]?: HyperKeySublayer | LayerCommand;
  },
  {
    sublayers: {
      get: function() {
        const variables = Object.keys(this).map(key => key.variable);

        return Object.entries(
          this as {
            [key_code in KeyCode]?: HyperKeySublayer | LayerCommand;
          },
        ).map(([ key, layer ]) => {
          return 'to' in layer
            ? {
                description: `Hyper Key + ${key}`,
                manipulators: [{
                  ...layer,
                  type: 'basic',
                  conditions: variables.map(variable => ({
                    type: 'variable_if',
                    name: variable,
                    value: 0,
                  })),
                  from: {
                    key_code: key,
                    modifiers: {
                      mandatory: [ 'command', 'control', 'option', 'shift' ],
                    },
                  },
                }],
              }
            : {
                description: `Hyper Key sublayer "${key}"`,
                manipulators: [{
                  description: `Toggle Hyper sublayer ${key}`,
                  type: 'basic',
                  conditions: variables
                    .filter(variable => variable !== key.variable)
                    .map(variable => ({
                      type: 'variable_if',
                      name: variable,
                      value: 0,
                    })),
                  from: {
                    key_code: key,
                    modifiers: {
                      mandatory: [ 'command', 'control', 'option', 'shift' ],
                    },
                  },
                  to: [
                    {
                      set_variable: {
                        name: key.variable,
                        value: 1,
                      },
                    },
                  ],
                  to_after_key_up: [
                    {
                      set_variable: {
                        name: key.variable,
                        value: 0,
                      },
                    },
                  ],
                },
                // Define the individual commands that are meant to trigger in the sublayer
                ...(Object.keys(layer) as (keyof typeof layer)[]).map(
                  (command_key): Manipulator => ({
                    ...layer[command_key],
                    type: 'basic',
                    // Only trigger this command if the variable is 1 (i.e., if Hyper + sublayer is held)
                    conditions: [
                      {
                        type: 'variable_if',
                        name: key.variable,
                        value: 1,
                      },
                    ],
                    from: {
                      key_code: command_key,
                      modifiers: {
                        mandatory: [ 'command', 'control', 'option', 'shift' ],
                      },
                    },
                  }),
                ) ],
              };
        });
      },
    },
  },
);
