import express from 'express';
import chalk from 'chalk';
import puppeteer from 'puppeteer';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { safeListeningHttpServer } from 'create-listening-server';
import { hookPageConsole } from './hook-page-console';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpackDevMiddleware = require('webpack-dev-middleware') as (
  compiler: webpack.Compiler
) => express.Handler & { close(): unknown };
const mochaSetupPath = require.resolve('../static/mocha-setup.js');

export interface IRunTestsOptions {
  preferredPort?: number;
  puppeteerConfig?: puppeteer.LaunchOptions & puppeteer.BrowserLaunchArgumentOptions & puppeteer.BrowserConnectOptions;
  webpackConfig?: webpack.Configuration;
  keepOpen?: boolean;
  colors?: boolean;
  reporter?: string;
  ui?: string;
  timeout?: number;
}

export async function runTests(testFiles: string[], options: IRunTestsOptions = {}): Promise<void> {
  const { webpackConfig = {}, puppeteerConfig = {}, preferredPort = 3000, keepOpen } = options;
  const closables: Array<{ close(): unknown | Promise<unknown> }> = [];

  try {
    console.log(`Bundling using webpack...`);
    const compiler = webpack({
      mode: 'development',
      ...webpackConfig,
      entry: {
        ...(await getEntryObject(webpackConfig.entry)),
        mocha: mochaSetupPath,
        units: testFiles,
      },
      plugins: createPluginsConfig(webpackConfig.plugins, options),
      stats: 'errors-warnings',
    });

    const devMiddleware = webpackDevMiddleware(compiler);
    closables.push(devMiddleware);

    compiler.hooks.done.tap('mocha-pup', () => console.log(`Done bundling.`));

    const webpackStats = await new Promise<webpack.Stats>((resolve) => {
      compiler.hooks.done.tap('mocha-pup', resolve);
    });

    if (webpackStats.hasErrors()) {
      throw new Error('Errors while bundling.');
    }
    const app = express();
    app.use(devMiddleware);
    app.use(express.static(compiler.options.context || process.cwd()));

    const { httpServer, port } = await safeListeningHttpServer(preferredPort, app);
    closables.push(httpServer);
    console.log(`HTTP server is listening on port ${port}`);

    const browser = await puppeteer.launch(puppeteerConfig);
    closables.push(browser);

    const [page] = await browser.pages();

    hookPageConsole(page);
    page.on('dialog', (dialog: puppeteer.Dialog) => {
      void dialog.dismiss();
    });

    const failsOnPageError = new Promise((_resolve, reject) => {
      page.once('pageerror', reject);
      page.once('error', reject);
    });

    await page.goto(`http://localhost:${port}/mocha.html`);

    const failedCount = await Promise.race([waitForTestResults(page), failsOnPageError]);

    if (failedCount) {
      throw chalk.red(`${failedCount as number} tests failed!`);
    }
  } finally {
    if (!keepOpen) {
      await Promise.all(closables.map((closable) => closable.close()));
      closables.length = 0;
    }
  }
}

function createPluginsConfig(
  existingPlugins: webpack.WebpackPluginInstance[] = [],
  options: IRunTestsOptions
): webpack.WebpackPluginInstance[] {
  return [
    ...existingPlugins,

    // insert html webpack plugin that targets our own chunks
    new HtmlWebpackPlugin({ filename: 'mocha.html', title: 'mocha tests', chunks: ['mocha', 'units'] }),

    // inject options to mocha-setup.js (in "static" folder)
    new webpack.DefinePlugin({
      'process.env': {
        MOCHA_UI: JSON.stringify(options.ui),
        MOCHA_COLORS: JSON.stringify(options.colors),
        MOCHA_REPORTER: JSON.stringify(options.reporter),
        MOCHA_TIMEOUT: JSON.stringify(options.timeout),
      },
    }),
  ];
}

async function waitForTestResults(page: puppeteer.Page): Promise<number> {
  await page.waitForFunction('mochaStatus.finished', { timeout: 0 });
  return page.evaluate('mochaStatus.failed') as Promise<number>;
}

/**
 * Helper around handling the multi-type entry field of user webpack config.
 * Converts it to object style, to allow adding additional chunks.
 */
async function getEntryObject(entry: webpack.Entry = {}): Promise<webpack.EntryObject> {
  if (typeof entry === 'function') {
    entry = await entry();
  }

  if (typeof entry === 'string' || Array.isArray(entry)) {
    return { main: entry };
  } else if (typeof entry === 'object') {
    return entry;
  }
  throw new Error(`Unsupported "entry" field type (${typeof entry}) in webpack configuration.`);
}
