/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import('prettier').Config}
 */
const config = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  importOrder: [
    '<BUILTIN_MODULES>', // Node.js built-in modules
    '',
    '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
    '',
    '^[.]', // relative imports
  ],
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
};

export default config;
