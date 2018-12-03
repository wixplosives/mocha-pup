import express from 'express'
import puppeteer from 'puppeteer'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { safeListeningHttpServer } from 'create-listening-server'
import { hookPageConsole } from './hook-page-console'

const mochaLibPath = require.resolve('mocha/mocha.js')
const mochaSetupPath = require.resolve('../static/mocha-setup.js')

export interface IRunTestsOptions {
    preferredPort?: number
    puppeteerConfig?: puppeteer.LaunchOptions
    webpackConfig?: webpack.Configuration
    keepOpen?: boolean
    colors?: boolean
    reporter?: string
    ui?: string
}

export async function runTests(testFiles: string[], options: IRunTestsOptions = {}) {
    const { webpackConfig = {}, puppeteerConfig = {}, preferredPort = 3000, keepOpen, colors } = options
    const closables: Array<{ close(): unknown | Promise<unknown> }> = []

    try {
        console.log(`Bundling using webpack...`)
        const compiler = webpack({
            ...webpackConfig,
            mode: 'development',
            devtool: false,
            entry: [mochaLibPath, mochaSetupPath, ...testFiles],
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

        const browser = await puppeteer.launch({
            defaultViewport: {
                width: 1024,
                height: 768
            },
            ...puppeteerConfig
        })
        closables.push(browser)

        const [page] = await browser.pages()

        hookPageConsole(page)
        page.on('dialog', dialog => dialog.dismiss())

        const failsOnPageError = new Promise((_resolve, reject) =>
            page.once('pageerror', reject).once('error', reject)
        )

        await page.goto(`http://localhost:${port}`)

        const failedCount = await Promise.race([waitForTestResults(page), failsOnPageError])

        if (failedCount) {
            throw new Error(`${failedCount} tests failed!`)
        }
    } finally {
        if (!keepOpen) {
            await Promise.all(closables.map(closable => closable.close()))
        }
    }
}

function createPluginsConfig(existingPlugins: webpack.Plugin[] = [], options: IRunTestsOptions): webpack.Plugin[] {
    return [
        ...existingPlugins.filter(p => !isHtmlWebpackPlugin(p)), // filter user's html webpack plugin
        new HtmlWebpackPlugin(),
        new webpack.DefinePlugin({
            mochaOptions: {
                ui: JSON.stringify(options.ui),
                useColors: options.colors,
                reporter: JSON.stringify(options.reporter),
            }
        })
    ]
}

function isHtmlWebpackPlugin(plugin: webpack.Plugin): boolean {
    // we use constuctor name for duck typing
    return plugin && (plugin as any).constructor && (plugin as any).constructor.name === 'HtmlWebpackPlugin'
}

async function waitForTestResults(page: puppeteer.Page): Promise<number> {
    await page.waitForFunction('mochaStatus.finished')
    return page.evaluate('mochaStatus.failed')
}
