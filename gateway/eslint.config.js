module.exports = [
  {
    files: ['index.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'error',
    },
  },
]
