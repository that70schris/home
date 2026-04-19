import { writeFileSync } from 'fs'
import './object'
import { KarabinerRule } from './types'

writeFileSync(
  `${process.env.HOME}/.config/karabiner/karabiner.json`,
  JSON.stringify({
    global: {
      show_in_menu_bar: false,
    },
    profiles: [{
      name: 'Default',
      virtual_hid_keyboard: {
        keyboard_type_v2: 'ansi',
      },
      complex_modifications: {
        parameters: {
          'basic.simultaneous_threshold_milliseconds': 50,
          'basic.to_delayed_action_delay_milliseconds': 500,
          'basic.to_if_alone_timeout_milliseconds': 1000,
          'basic.to_if_held_down_threshold_milliseconds': 500,
          'mouse_motion_to_scroll.speed': 100,
        },
        rules: [
          {
            description: 'Hyper Key (⌃⌥⇧⌘)',
            manipulators: [{
              type: 'basic',
              description: 'Caps Lock -> Hyper Key',
              from: {
                key_code: 'caps_lock',
                modifiers: {
                  optional: ['any'],
                },
              },
              to: [{
                key_code: 'caps_lock',
                modifiers: [
                  'command',
                  'control',
                  'option',
                  'shift',
                ],
              }],
              to_if_alone: [{
                key_code: 'escape',
              }],
            }],
          },
          ...{
            // o: {
            //   e: 'Mail'.app,
            // },
          }.sublayers,
        ] as KarabinerRule[],
      },
    }],
  },
  null,
  2),
)
