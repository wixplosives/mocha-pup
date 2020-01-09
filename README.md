# mocha-pup
[![Build Status](https://github.com/wixplosives/mocha-pup/workflows/tests/badge.svg)](https://github.com/wixplosives/mocha-pup/actions)
[![npm version](https://img.shields.io/npm/v/mocha-pup.svg)](https://www.npmjs.com/package/mocha-pup)

Run mocha tests in Chrome, using webpack and puppeteer.

## Installation

Install `mocha-pup` as a dev dependency:
```
yarn add mocha-pup --dev
```

## Usage

A CLI named `mocha-pup` is available after installation:
```
mocha-pup [options] <glob ...>
```

For example:
```
mocha-pup "test/**/*.spec.js" 
mocha-pup "test/**/*.spec.ts" -c webpack.config.js 
```

## CLI Options

```
  -v, --version                       output the version number
  -c, --webpack-config <config file>  webpack configuration file to bundle with
  -d, --dev                           never-closed, non-headless, open-devtools puppeteer session
  -l, --list-files                    list found test files
  -t, --timeout <ms>                  mocha timeout in ms (default: 2000)
  --reporter <spec/html/dot/...>      mocha reporter to use (default: "spec")
  --ui <bdd|tdd|qunit|exports>        user interface of mocha (default: "bdd")
  --no-colors                         turn off colors (default is env detected)
  -h, --help                          output usage information
```

### License

MIT
