'use strict';

module.exports = {
  env: {
    commonjs: true,
    browser: true,
  },
  globals: {
    // ES 6
    Map: true,
    Set: true,
    Proxy: true,
    Symbol: true,
    WeakMap: true,
    // Vendor specific
    MSApp: true,
    __REACT_DEVTOOLS_GLOBAL_HOOK__: true,
    __REACT_UNSTABLE_SUPPRESS_ERROR_LOGGING__: true,
    // CommonJS / Node
    process: true,
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
  },
  rules: {
    'no-undef': 'error',
    'no-shadow-restricted-names': 'error',
  },
};
