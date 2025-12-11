export default {
  plugins: [
    'stylelint-order',
    'stylelint-prettier',
  ],
  rules: {
    'prettier/prettier': true,
    'color-no-invalid-hex': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'media-feature-name-no-unknown': true,
    'no-duplicate-at-import-rules': true,
    'no-duplicate-selectors': true,
    'property-no-vendor-prefix': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-colon-notation': 'single',
    'selector-pseudo-element-no-unknown': [ true, {
      ignorePseudoElements: ['/deep/'],
    }],
    'unit-no-unknown': true,
    'value-no-vendor-prefix': true,
    'order/properties-alphabetical-order': true,
    'order/order':
    [
      'custom-properties',
      'at-rules',
      'at-variables',
      'dollar-variables',
      'declarations',
      { type: 'at-rule', name: 'media' },
      'rules',
      { type: 'at-rule', name: 'at-root' },
    ],
  },
}
