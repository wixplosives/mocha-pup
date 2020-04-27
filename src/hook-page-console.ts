import puppeteer from 'puppeteer';
import { deferred } from 'promise-assist';

/**
 * Hooks the console of a `puppeteer.Page` to Node's console,
 * printing anything from the page in Node.
 */
export function hookPageConsole(page: puppeteer.Page): void {
  let currentMessage: Promise<void> = Promise.resolve();

  page.on('console', async (msg) => {
    const consoleFn = messageTypeToConsoleFn[msg.type()];
    if (!consoleFn) {
      return;
    }

    const { promise, resolve } = deferred();
    const previousMessage = currentMessage;
    currentMessage = promise;
    try {
      const msgArgs = await Promise.all(msg.args().map((arg) => extractErrorMessage(arg) || arg.jsonValue()));
      await previousMessage;
      consoleFn.apply(console, msgArgs);
    } catch (e) {
      console.error(e);
    } finally {
      resolve();
    }
  });
}

const messageTypeToConsoleFn: { [key in puppeteer.ConsoleMessageType]?: ((...args: any[]) => void) | undefined } = {
  log: console.log,
  warning: console.warn,
  error: console.error,
  info: console.info,
  assert: console.assert,
  debug: console.debug,
  trace: console.trace,
  dir: console.dir,
  dirxml: console.dirxml,
  profile: console.profile,
  profileEnd: console.profileEnd,
  startGroup: console.group,
  startGroupCollapsed: console.groupCollapsed,
  endGroup: console.groupEnd,
  table: console.table,
  count: console.count,
  timeEnd: console.timeEnd,

  // we ignore calls to console.clear, as we don't want the page to clear our terminal
  // clear: console.clear
};

// workaround to get hidden description
// jsonValue() on errors returns {}
function extractErrorMessage(arg: any): string | undefined {
  return arg?._remoteObject?.subtype === 'error' ? arg._remoteObject.description : undefined;
}
