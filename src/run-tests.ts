import express from 'express'
import chalk from 'chalk'
import puppeteer from 'puppeteer'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { safeListeningHttpServer } from 'create-listening-server'
import { hookPageConsole } from './hook-page-console'

const mochaSetupPath = require.resolve('../static/mocha-setup.js')

export interface IRunTestsOptions {
    preferredPort?: number
    puppeteerConfig?: puppeteer.LaunchOptions
    webpackConfig?: webpack.Configuration
    keepOpen?: boolean
    colors?: boolean
    reporter?: string
    ui?: string
    timeout?: number
}

export async function runTests(testFiles: string[], options: IRunTestsOptions = {}) {
    const { webpackConfig = {}, puppeteerConfig = {}, preferredPort = 3000, keepOpen, colors } = options
    const closables: Array<{ close(): unknown | Promise<unknown> }> = []

    try {
        console.log(`Bundling using webpack...`)
        const compiler = webpack({
            mode: 'development',
            ...webpackConfig,
            entry: {
                ...getEntryObject(webpackConfig.entry),
                mocha: mochaSetupPath,
                units: testFiles
            },
            plugins: createPluginsConfig(webpackConfig.plugins, options)
        })

        const devMiddleware = webpackDevMiddleware(compiler, { logLevel: 'warn', publicPath: '/' })
        closables.push(devMiddleware)

        const webpackStats = await new Promise<webpack.Stats>(resolve => {
            compiler.hooks.done.tap('mocha-pup hook', resolve)
        })

        console.log(`Done bundling.`)

        if (webpackStats.hasErrors()) {
            throw new Error(webpackStats.toString({ colors }))
        } else if (webpackStats.hasWarnings()) {
            console.warn(webpackStats.toString({ colors }))
        }
        const app = express()
        app.use(devMiddleware)

        const { httpServer, port } = await safeListeningHttpServer(preferredPort, app)
        closables.push(httpServer)
        console.log(`HTTP server is listening on port ${port}`)

        const browser = await puppeteer.launch(puppeteerConfig)
        closables.push(browser)

        const [page] = await browser.pages()

        hookPageConsole(page)
        page.on('dialog', dialog => dialog.dismiss())

        const failsOnPageError = new Promise((_resolve, reject) =>
            page.once('pageerror', reject).once('error', reject)
        )

        await page.goto(`http://localhost:${port}/mocha.html`)

        const failedCount = await Promise.race([waitForTestResults(page), failsOnPageError])

        if (failedCount) {
            throw chalk.red(`${failedCount} tests failed!`)
        }
    } finally {
        if (!keepOpen) {
            await Promise.all(closables.map(closable => closable.close()))
            closables.length = 0
        }
    }
}

function createPluginsConfig(existingPlugins: webpack.Plugin[] = [], options: IRunTestsOptions): webpack.Plugin[] {
    return [
        ...existingPlugins,

        // insert html webpack plugin that targets our own chunks
        new HtmlWebpackPlugin({ filename: 'mocha.html', title: 'mocha tests', chunks: ['mocha', 'units'] }),

        // inject options to mocha-setup.js (in "static" folder)
        new webpack.DefinePlugin({
            'process.env': {
                MOCHA_UI: JSON.stringify(options.ui),
                MOCHA_COLORS: options.colors,
                MOCHA_REPORTER: JSON.stringify(options.reporter),
                MOCHA_TIMEOUT: options.timeout,
            }
        })
    ]
}

async function waitForTestResults(page: puppeteer.Page): Promise<number> {
    await page.waitForFunction('mochaStatus.finished', { timeout: 0 })
    return page.evaluate('mochaStatus.failed')
}

/**
 * Helper around handling the multi-type entry field of user webpack config.
 * Converts it to object style, to allow adding additional chunks.
 */
function getEntryObject(entry: string | string[] | webpack.Entry | webpack.EntryFunc = {}): webpack.Entry {
    const entryType = typeof entry

    if (entryType === 'string' || Array.isArray(entry)) {
        return { main: entry as string | string[] }
    } else if (entryType === 'object') {
        return entry as webpack.Entry
    }
    throw new Error(`Unsupported "entry" field type (${entryType}) in webpack configuration.`)
}
