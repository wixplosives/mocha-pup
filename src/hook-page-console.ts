import puppeteer from 'puppeteer'

/**
 * Hooks the console of a `puppeteer.Page` to Node's console,
 * printing anything from the page in Node.
 */
export function hookPageConsole(page: puppeteer.Page): void {
    page.on('console', async msg => {
        const consoleFn = messageTypeToConsoleFn[msg.type()]
        if (consoleFn) {
            const msgArgs = await Promise.all(msg.args().map(arg => arg.jsonValue()))
            consoleFn.apply(console, msgArgs)
        }
    })
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
}
