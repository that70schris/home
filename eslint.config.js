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
      // turn all stylistic errors into warnings
      ...Object.entries(stylistic.configs.recommended.rules)
        .reduce((result, [ key, value ]) => {
          return {
            ...result,
            [key]: ['warn'].concat(
              [].concat(value).slice(1),
            ),
          };
        }, {}),
      // override some stylistic rules
      ...Object.entries({
        'array-bracket-newline': [ 1, 'consistent' ],
        'array-bracket-spacing': [ 1, 'always', {
          objectsInArrays: false,
          arraysInArrays: false,
          singleValue: false,
        }],
        'array-element-newline': [ 1, 'consistent' ],
        'brace-style': [ 1, '1tbs' ],
        'function-call-argument-newline': [ 1, 'consistent' ],
        'function-paren-newline': [ 1, 'consistent' ],
        'no-extra-semi': 1,
        'no-multiple-empty-lines': [ 1, {
          maxEOF: 0,
          max: 1,
        }],
        'object-curly-newline': [ 1, {
          consistent: true,
          multiline: true,
        }],
        'semi': [ 1, 'always' ],
        'space-before-function-paren': [ 1, 'never' ],
        'switch-colon-spacing': 1,
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
      'no-empty': [ 1, {
        allowEmptyCatch: false,
      }],
      'no-else-return': 1,
      'no-eval': 1,
      'no-extra-label': 1,
      'no-implied-eval': 1,
      'no-inner-declarations': 1,
      'no-lonely-if': 1,
      'no-new-func': 1,
      'no-new-wrappers': 1,
      'no-param-reassign': 1,
      'no-promise-executor-return': 1,
      'no-script-url': 1,
      'no-self-compare': 1,
      'no-template-curly-in-string': 1,
      'no-throw-literal': 1,
      'no-unassigned-vars': 1,
      'no-undef-init': 1,
      'no-unmodified-loop-condition': 1,
      'no-unneeded-ternary': 1,
      'no-unreachable-loop': 1,
      'no-use-before-define': 1,
      'no-useless-assignment': 1,
      'no-var': 1,
      'one-var': [ 1, 'never' ],
      'prefer-arrow-callback': 1,
      'prefer-template': 1,
      'require-atomic-updates': 1,
      'yoda': 1,
    },
  },
]);
