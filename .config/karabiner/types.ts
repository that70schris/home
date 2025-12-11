export interface KarabinerRule {
  description?: string
  manipulators?: Manipulator[]
}

export interface Manipulator {
  description?: string
  type: 'basic'
  from: From
  to?: To[]
  to_after_key_up?: To[]
  to_if_alone?: To[]
  parameters?: Parameters
  conditions?: Conditions[]
}

export interface Parameters {
  'basic.simultaneous_threshold_milliseconds'?: number
}

type Conditions =
  | FrontMostApplicationCondition
  | DeviceCondition
  | KeybaordTypeCondition
  | InputSourceCondition
  | VaribaleCondition
  | EventChangedCondition

type FrontMostApplicationCondition = {
  type: 'frontmost_application_if' | 'frontmost_application_unless'
  bundle_identifiers?: string[]
  file_paths?: string[]
  description?: string
}

type DeviceCondition = {
  type:
    | 'device_if'
    | 'device_unless'
    | 'device_exists_if'
    | 'device_exists_unless'
  identifiers: Identifiers
  description?: string
}

interface Identifiers {
  vendor_id?: number
  product_id?: number
  location_id?: number
  is_keyboard?: boolean
  is_pointing_device?: boolean
  is_touch_bar?: boolean
  is_built_in_keyboard?: boolean
}

type KeybaordTypeCondition = {
  type: 'keyboard_type_if' | 'keyboard_type_unless'
  keyboard_types: string[]
  description?: string
}

type InputSourceCondition = {
  type: 'input_source_if' | 'input_source_unless'
  input_sources: InputSource[]
  description?: string
}

interface InputSource {
  language?: string
  input_source_id?: string
  input_mode_id?: string
}

type VaribaleCondition = {
  type: 'variable_if' | 'variable_unless'
  name: string | number | boolean
  value: string | number
  description?: string
}

type EventChangedCondition = {
  type: 'event_changed_if' | 'event_changed_unless'
  value: boolean
  description?: string
}

export interface SimultaneousFrom {
  key_code: KeyCode
}

export interface SimultaneousOptions {
  key_down_order?: 'insensitive' | 'strict' | 'strict_inverse'
  detect_key_down_uninterruptedly?: boolean
}

export interface From {
  key_code?: KeyCode
  simultaneous?: SimultaneousFrom[]
  simultaneous_options?: SimultaneousOptions
  modifiers?: Modifiers
}

export interface Modifiers {
  optional?: string[]
  mandatory?: string[]
}

export interface To {
  key_code?: KeyCode
  modifiers?: string[]
  shell_command?: string
  set_variable?: {
    name: string
    value: boolean | number | string
  }
  mouse_key?: MouseKey
  pointing_button?: string
  /**
   * Power Management plugin
   * @example: sleep system
   * @see: {@link https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/iokit_power_management_sleep_system/}
   */
  software_function?: SoftwareFunction
}

export interface MouseKey {
  y?: number
  x?: number
  speed_multiplier?: number
  vertical_wheel?: number
  horizontal_wheel?: number
}

export interface SoftwareFunction {
  iokit_power_management_sleep_system?: object
}

export type KeyCode =
  | 'caps_lock'
  | 'left_control'
  | 'left_shift'
  | 'left_option'
  | 'left_command'
  | 'right_shift'
  | 'right_option'
  | 'right_command'
  | 'fn'
  | 'return_or_enter'
  | 'escape'
  | 'delete_or_backspace'
  | 'delete_forward'
  | 'tab'
  | 'spacebar'
  | 'hyphen'
  | 'equal_sign'
  | 'open_bracket'
  | 'close_bracket'
  | 'backslash'
  | 'non_us_pound'
  | 'semicolon'
  | 'quote'
  | 'grave_accent_and_tilde'
  | 'comma'
  | 'period'
  | 'slash'
  | 'non_us_backslash'
  | 'up_arrow'
  | 'down_arrow'
  | 'left_arrow'
  | 'right_arrow'
  | 'page_up'
  | 'page_down'
  | 'home'
  | 'end'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '0'
  | 'f1'
  | 'f2'
  | 'f3'
  | 'f4'
  | 'f5'
  | 'f6'
  | 'f7'
  | 'f8'
  | 'f9'
  | 'f10'
  | 'f11'
  | 'f12'
  | 'f13'
  | 'f14'
  | 'f15'
  | 'f16'
  | 'f17'
  | 'f18'
  | 'f19'
  | 'f20'
  | 'f21'
  | 'f22'
  | 'f23'
  | 'f24'
  | 'display_brightness_decrement'
  | 'display_brightness_increment'
  | 'mission_control'
  | 'launchpad'
  | 'dashboard'
  | 'illumination_decrement'
  | 'illumination_increment'
  | 'rewind'
  | 'play_or_pause'
  | 'fastforward'
  | 'mute'
  | 'volume_decrement'
  | 'volume_increment'
  | 'eject'
  | 'apple_display_brightness_decrement'
  | 'apple_display_brightness_increment'
  | 'apple_top_case_display_brightness_decrement'
  | 'apple_top_case_display_brightness_increment'
  | 'keypad_num_lock'
  | 'keypad_slash'
  | 'keypad_asterisk'
  | 'keypad_hyphen'
  | 'keypad_plus'
  | 'keypad_enter'
  | 'keypad_1'
  | 'keypad_2'
  | 'keypad_3'
  | 'keypad_4'
  | 'keypad_5'
  | 'keypad_6'
  | 'keypad_7'
  | 'keypad_8'
  | 'keypad_9'
  | 'keypad_0'
  | 'keypad_period'
  | 'keypad_equal_sign'
  | 'keypad_comma'
  | 'vk_none'
  | 'print_screen'
  | 'scroll_lock'
  | 'pause'
  | 'insert'
  | 'application'
  | 'help'
  | 'power'
  | 'execute'
  | 'menu'
  | 'select'
  | 'stop'
  | 'again'
  | 'undo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'find'
  | 'international1'
  | 'international2'
  | 'international3'
  | 'international4'
  | 'international5'
  | 'international6'
  | 'international7'
  | 'international8'
  | 'international9'
  | 'lang1'
  | 'lang2'
  | 'lang3'
  | 'lang4'
  | 'lang5'
  | 'lang6'
  | 'lang7'
  | 'lang8'
  | 'lang9'
  | 'japanese_eisuu'
  | 'japanese_kana'
  | 'japanese_pc_nfer'
  | 'japanese_pc_xfer'
  | 'japanese_pc_katakana'
  | 'keypad_equal_sign_as400'
  | 'locking_caps_lock'
  | 'locking_num_lock'
  | 'locking_scroll_lock'
  | 'alternate_erase'
  | 'sys_req_or_attention'
  | 'cancel'
  | 'clear'
  | 'prior'
  | 'return'
  | 'separator'
  | 'out'
  | 'oper'
  | 'clear_or_again'
  | 'cr_sel_or_props'
  | 'ex_sel'
  | 'left_alt'
  | 'left_gui'
  | 'right_alt'
  | 'right_gui'
  | 'vk_consumer_brightness_down'
  | 'vk_consumer_brightness_up'
  | 'vk_mission_control'
  | 'vk_launchpad'
  | 'vk_dashboard'
  | 'vk_consumer_illumination_down'
  | 'vk_consumer_illumination_up'
  | 'vk_consumer_previous'
  | 'vk_consumer_play'
  | 'vk_consumer_next'
  | 'volume_down'
  | 'volume_up'

export class LayerCommand {
  description?: string
  to?: To[]
}

export type HyperKeySublayer = {
  [key_code in KeyCode]?: LayerCommand
}
