import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  stylistic.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.builtin,
        ...globals.node,
      },
    },

    rules: Object.entries({
      // turn all stylistic errors into warnings
      ...Object.entries(stylistic.configs.recommended.rules)
        .reduce((result, [ key, value ]) => ({
          ...result,
          [key]: ['warn'].concat(
            [].concat(value).slice(1),
          ),
        }), {}),

      // custom styles
      ...Object.entries({
        array_bracket_newline: [ 1, 'consistent' ],
        array_bracket_spacing: [ 1, 'always', {
          objectsInArrays: false,
          arraysInArrays: false,
          singleValue: false,
        }],
        array_element_newline: [ 1, 'consistent' ],
        brace_style: [ 1, '1tbs' ],
        function_call_argument_newline: [ 1, 'consistent' ],
        function_paren_newline: [ 1, 'consistent' ],
        no_extra_semi: 1,
        no_multiple_empty_lines: [ 1, {
          maxEOF: 0,
          max: 1,
        }],
        object_curly_newline: [ 1, {
          consistent: true,
          multiline: true,
        }],
        semi: [ 1, 'always' ],
        space_before_function_paren: [ 1, 'never' ],
        switch_colon_spacing: 1,
      }).reduce((result, [ key, value ]) => ({
        ...result,
        [`@stylistic/${key}`]: value,
      }), {}),

      // custom rules
      array_callback_return: 1,
      block_scoped_var: 2,
      curly: [ 1, 'all' ],
      dot_notation: 1,
      no_await_in_loop: 1,
      no_console: 1,
      no_constructor_return: 1,
      no_duplicate_imports: 1,
      no_empty: [ 1, {
        allowEmptyCatch: false,
      }],
      no_else_return: 1,
      no_eval: 1,
      no_extra_label: 1,
      no_implied_eval: 1,
      no_inner_declarations: 1,
      no_lonely_if: 1,
      no_new_func: 1,
      no_new_wrappers: 1,
      no_param_reassign: 1,
      no_promise_executor_return: 1,
      no_script_url: 1,
      no_self_compare: 1,
      no_template_curly_in_string: 1,
      no_throw_literal: 1,
      no_unassigned_vars: 1,
      no_undef_init: 1,
      no_unmodified_loop_condition: 1,
      no_unneeded_ternary: 1,
      no_unreachable_loop: 1,
      no_use_before_define: 1,
      no_useless_assignment: 1,
      no_var: 1,
      one_var: [ 1, 'never' ],
      prefer_arrow_callback: 1,
      prefer_template: 1,
      require_atomic_updates: 1,
      yoda: 1,
    }).reduce((result, [ key, value ]) => ({
      ...result,
      [key.replace(/_/g, '-')]: value,
    }), {}),

  },
]);
