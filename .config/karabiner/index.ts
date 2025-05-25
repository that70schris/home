import { writeFileSync } from 'fs';
import './object';
import { KarabinerRule } from './types';

writeFileSync(
  `${process.env.HOME}/.config/karabiner/karabiner.json`,
  JSON.stringify(
    {
      global: {
        show_in_menu_bar: false,
      },
      profiles: [
        {
          name: 'Default',
          virtual_hid_keyboard: {
            keyboard_type_v2: 'ansi',
          },
          complex_modifications: {
            rules: [
              {
                description: 'Hyper Key (⌃⌥⇧⌘)',
                manipulators: [
                  {
                    description: 'Caps Lock -> Hyper Key',
                    from: {
                      key_code: 'caps_lock',
                      modifiers: {
                        optional: ['any'],
                      },
                    },
                    to: [
                      {
                        key_code: 'right_command',
                        modifiers: ['command', 'control', 'option', 'shift'],
                      },
                    ],
                    to_if_alone: [
                      {
                        key_code: 'escape',
                      },
                    ],
                    type: 'basic',
                  },
                ],
              },
              ...{
                o: {
                  a: 'Arc'.app,
                  c: 'Calendar'.app,
                  e: 'Mail'.app,
                  f: 'Finder'.app,
                  i: 'Messages'.app, // 'i'Message
                  n: 'Notes'.app,
                  s: 'Slack'.app,
                },
                s: {
                  backslash:
                    `raycast://extensions/raycast/system/toggle-system-appearance`
                      .open,
                },
              }.sublayers,
            ] as KarabinerRule[],
          },
        },
      ],
    },
    null,
    2,
  ),
);
