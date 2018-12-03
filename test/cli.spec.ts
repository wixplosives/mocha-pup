import { expect } from 'chai'
import { join } from 'path'
import { runCommand } from './run-command'

const mochaPup = `node -r @ts-tools/node ${join(__dirname, '..', 'src', 'cli.ts --no-colors')}`
const fixturesRoot = join(__dirname, '..', 'fixtures')

describe('mocha-pup', () => {
    it('allows running a single test file', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./sample.spec.js`, { cwd: fixturesRoot })

        expect(output).to.include(`2 passing`)
        expect(exitCode).to.equal(0)
    })

    it('fails when there are test errors', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./should-fail.spec.js`, { cwd: fixturesRoot })

        expect(output).to.include(`1 tests failed`)
        expect(output).to.include(`some error message`)
        expect(exitCode).to.not.equal(0)
    })

    it('targets files when provided with globs')
    it('errors if not finding test files')
    it('fails when there are bundling errors')

})
