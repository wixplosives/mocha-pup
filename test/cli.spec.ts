import { expect } from 'chai'
import { join } from 'path'
import { spawnAsync } from './spawn-async'

const cliSrcPath = require.resolve('../src/cli.ts')
const fixturesRoot = join(__dirname, '..', 'fixtures')

const runMochaPup = (...args: string[]) => spawnAsync('node',
    ['-r', '@ts-tools/node', cliSrcPath, '--no-colors', '-l', ...args],
    { cwd: fixturesRoot, shell: true }
)

describe('mocha-pup', () => {
    it('runs test files specified directly', async () => {
        const { output, exitCode } = await runMochaPup('./sample.spec.js')

        expect(output).to.include(`Found 1 test files`)
        expect(output).to.include(`2 passing`)
        expect(exitCode).to.equal(0)
    })

    it('runs test files specified using globs', async () => {
        const { output, exitCode } = await runMochaPup('"./**/*.spec.js"')

        expect(output).to.include(`Found 2 test files`)
        expect(output).to.include(`3 passing`)
        expect(exitCode).to.equal(0)

    })

    it('fails when there are test errors', async () => {
        const { output, exitCode } = await runMochaPup('./should-fail.unit.js')

        expect(output).to.include(`1 tests failed`)
        expect(output).to.include(`some error message`)
        expect(exitCode).to.not.equal(0)
    })

    it('fails if not finding test files', async () => {
        const { output, exitCode } = await runMochaPup('"./*.missing.js"')

        expect(output).to.include(`Cannot find any test files`)
        expect(exitCode).to.not.equal(0)
    })

    it('allows bundling using existing configuration')
    it('ignores existing html-webpack-plugin in webpack configuration')
    it('fails when there are bundling errors')
    it('fails when the page has an error')
})
