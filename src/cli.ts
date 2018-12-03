#!/usr/bin/env node

import path from 'path'
import program from 'commander'
import glob from 'glob'
import webpack from 'webpack'
import puppeteer from 'puppeteer'
import chalk from 'chalk'
import { runTests } from './run-tests'

const { version, description } = require('../package.json')

process.on('unhandledRejection', printErrorAndExit)

program
    .version(version, '-v, --version')
    .description(description)
    .usage('[options] <glob ...>')
    .option('-c, --webpack-config <config file>', 'webpack configuration file to bundle with')
    .option('-d, --dev', 'never-closed, non-headless, open-devtools puppeteer session')
    .option('-l, --list-files', 'list found test files')
    .option('-t, --timeout <ms>', 'mocha timeout in ms', 2000)
    .option('--reporter <spec/html/dot/...>', 'mocha reporter to use', 'spec')
    .option('--ui <bdd|tdd|qunit|exports>', 'mocha user interface', 'bdd')
    .option('--no-colors', 'turn off colors (default is env detected)')
    .parse(process.argv)

const { args, webpackConfig: userWebpackConfig, dev, listFiles, colors, reporter, timeout, ui } = program

const foundFiles: string[] = []
for (const arg of args) {
    for (const foundFile of glob.sync(arg, { absolute: true })) {
        foundFiles.push(foundFile)
    }
}

const { length: numFound } = foundFiles
if (numFound === 0) {
    program.outputHelp()
    printErrorAndExit(chalk.red(`Cannot find any test files`))
}

console.log(`Found ${numFound} test files in ${process.cwd()}`)
if (listFiles) {
    for (const foundFile of foundFiles) {
        console.log(`- ${foundFile}`)
    }
}

const webpackConfig: webpack.Configuration = userWebpackConfig ? require(path.resolve(userWebpackConfig)) : {}
const puppeteerConfig: puppeteer.LaunchOptions = dev ? { devtools: true } : {}

if (typeof webpackConfig === 'function') {
    printErrorAndExit(chalk.red('Webpack configuration file exports a function, which is not yet supported.'))
}

runTests(foundFiles, {
    webpackConfig,
    puppeteerConfig,
    keepOpen: dev,
    colors: colors === undefined ? !!chalk.supportsColor : colors,
    reporter,
    timeout,
    ui
}).catch(printErrorAndExit)

function printErrorAndExit(message: unknown) {
    console.error(message)
    if (!dev) {
        // keep process open in dev mode
        process.exit(1)
    }
}
