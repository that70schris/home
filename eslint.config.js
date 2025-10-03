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
          value = [].concat(value);
          value[0] = 'warn';

          return {
            ...result,
            [key]: value,
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
        'brace-style': [ 1, '1tbs', {
          allowSingleLine: true,
        }],
        'function-call-argument-newline': [ 1, 'consistent' ],
        'function-paren-newline': [ 1, 'consistent' ],
        'lines-between-class-members': [ 1, 'always', {
          exceptAfterSingleLine: true,
        }],
        'no-extra-semi': 1,
        'no-multiple-empty-lines': [ 1, {
          max: 1,
        }],
        'object-curly-newline': [ 1, {
          consistent: true,
          multiline: true,
        }],
        'operator-linebreak': [ 1, 'before' ],
        'padded-blocks': [ 1, {
          blocks: 'never',
        }],
        'quote-props': [ 1, 'consistent-as-needed' ],
        'semi': [ 1, 'always' ],
        'space-before-function-paren': [ 1, 'never' ],
        'space-infix-ops': [ 1, {
          int32Hint: true,
        }],
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
      'no-else-return': 1,
      'no-eval': 1,
      'no-extra-bind': 1,
      'no-extra-boolean-cast': 1,
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
      'no-unused-labels': 1,
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
