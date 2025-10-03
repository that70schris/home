import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  {
    ...stylistic.configs.recommended,
    rules: {
      ...stylistic.configs.recommended.rules,
      ...Object.entries({
        'array-bracket-newline': [ 1, 'consistent' ],
        'array-bracket-spacing': [ 1, 'always', {
          singleValue: false,
          objectsInArrays: false,
          arraysInArrays: false,
        }],
        'array-element-newline': [ 1, 'consistent' ],
        'arrow-spacing': [ 1, {
          before: true,
          after: true,
        }],
        'brace-style': [ 1, '1tbs', {
          allowSingleLine: true,
        }],

        'comma-dangle': [ 1, 'always-multiline' ],
        'comma-spacing': [ 1, {
          before: false,
          after: true,
        }],
        'comma-style': [ 1, 'last' ],

        'computed-property-spacing': [ 1, 'never' ],
        // 'eol-last': 1,

        'function-call-argument-newline': [ 1, 'consistent' ],
        'function-call-spacing': [ 1, 'never' ],
        'function-paren-newline': [ 1, 'consistent' ],
        'implicit-arrow-linebreak': [ 1, 'beside' ],
        'indent': [ 1, 2, {
          SwitchCase: 1,
        }],
        'key-spacing': [ 1, {
          beforeColon: false,
          afterColon: true,
          mode: 'strict',
        }],

        'keyword-spacing': [ 1, {
          before: true,
          after: true,
        }],
        'linebreak-style': [ 1, 'unix' ],
        'lines-between-class-members': [ 1, 'always', {
          exceptAfterSingleLine: true,
        }],

        'new-parens': 1,
        'no-extra-semi': 1,
        'no-extra-parens': [ 1, 'functions' ],
        // 'no-floating-decimal': 2,
        'no-multi-spaces': 1,
        'semi': [ 1, 'always' ],
      }).reduce((result, [ key, value ]) => {
        return {
          ...result,
          [`@stylistic/${key}`]: value,
        };
      }, {}),
    },
  },
  {
    rules: {
      'array-callback-return': 1,
      'block-scoped-var': 2,
      'curly': [ 1, 'all' ],
      'dot-notation': 1,
      'no-await-in-loop': 1,
      'no-console': 1,
      'no-constructor-return': 1,
      'no-duplicate-imports': 1,
      // 'no-else-return': [ 2, {
      //   allowElseIf: false,
      // }],
      // 'no-eval': [ 1, {
      //   allowIndirect: false,
      // }],
      // 'no-extra-bind': 1,
      'no-extra-boolean-cast': 1,
      'no-extra-label': 1,

      'no-implied-eval': 1,
      'no-inner-declarations': 1,
      'no-lonely-if': 1,
      // 'no-multi-spaces': 1,
      // 'no-multiple-empty-lines': [ 1, {
      //   max: 1,
      // }],
      // 'no-new-func': 2,
      // 'no-new-wrappers': 2,
      // 'no-param-reassign': 2,
      'no-promise-executor-return': 1,
      // 'no-script-url': 2,
      'no-self-compare': 1,
      'no-template-curly-in-string': 1,
      // 'no-throw-literal': 2,
      'no-unassigned-vars': 1,
      // 'no-undef-init': 1,
      'no-unmodified-loop-condition': 1,
      // 'no-unneeded-ternary': 1,
      'no-unreachable-loop': 1,
      'no-unused-labels': 1,
      'no-use-before-define': [ 1, {
        functions: true,
        variables: true,
        classes: false,
      }],
      'no-useless-assignment': 1,
      // 'no-var': 1,
      // 'no-whitespace-before-property': 1,
      // 'object-curly-newline': [ 1, {
      //   multiline: true,
      //   consistent: true,
      // }],
      // 'object-curly-spacing': [ 1, 'always' ],
      // 'one-var': [ 1, 'never' ],
      // 'operator-linebreak': [ 1, 'before' ],
      // 'padded-blocks': [ 1, {
      //   blocks: 'never',
      // }],
      // 'prefer-arrow-callback': 1,
      // 'prefer-template': 1,
      // 'quote-props': [ 1, 'consistent-as-needed' ],
      // 'quotes': [ 1, 'single' ],
      // 'rest-spread-spacing': [ 1, 'never' ],
      'require-atomic-updates': 1,
      // 'semi-spacing': [ 1, {
      //   before: false,
      //   after: true,
      // }],
      // 'space-before-blocks': [ 1, 'always' ],
      // 'space-before-function-paren': [ 1, 'never' ],
      // 'space-in-parens': [ 1, 'never' ],
      // 'space-infix-ops': [ 1, {
      //   int32Hint: true,
      // }],
      // 'space-unary-ops': [ 1, {
      //   words: true,
      //   nonwords: false,
      // }],
      // 'switch-colon-spacing': [ 1, {
      //   before: false,
      //   after: true,
      // }],
      // 'template-curly-spacing': [ 1, 'never' ],
      // 'wrap-iife': [ 1, 'inside' ],
      'yoda': 1,
    },
  },
]);
