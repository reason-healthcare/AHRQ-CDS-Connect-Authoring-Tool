import plugins from '@eslint/js';
import globals from 'globals';

const config = [
  plugins.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 2022
      },
      globals: {
        ...globals.es2015,
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      'no-param-reassign': ['error', { props: false }],
      'no-underscore-dangle': ['error', { allow: ['_id', '__filename', '__dirname'] }], // because mongo and common Node.js conventions
      'no-unused-vars': ['error', { args: 'none' }], // don't check function arguments
      'no-use-before-define': ['error', 'nofunc'],
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }] // allow ++ in for loop expression
    }
  },
  {
    ignores: [
      'src/cql-merge/import/grammar*/**'
    ]
  }
];

export default config;
