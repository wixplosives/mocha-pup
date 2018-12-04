import { expect } from 'chai'
import { join } from 'path'
import { runCommand } from './run-command'

const mochaPup = `node -r @ts-tools/node ${join(__dirname, '..', 'src', 'cli.ts --no-colors')}`
const fixturesRoot = join(__dirname, '..', 'fixtures')

describe('mocha-pup', () => {
    it('runs test files specified directly', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./sample.spec.js`, { cwd: fixturesRoot })

        expect(output).to.include(`Found 1 test files`)
        expect(output).to.include(`2 passing`)
        expect(exitCode).to.equal(0)
    })

    it('runs test files specified using globs', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./**/*.spec.js`, { cwd: fixturesRoot })

        expect(output).to.include(`Found 2 test files`)
        expect(output).to.include(`3 passing`)
        expect(exitCode).to.equal(0)

    })

    it('fails when there are test errors', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./should-fail.unit.js`, { cwd: fixturesRoot })

        expect(output).to.include(`1 tests failed`)
        expect(output).to.include(`some error message`)
        expect(exitCode).to.not.equal(0)
    })

    it('fails if not finding test files', () => {
        const { output, exitCode } = runCommand(`${mochaPup} ./*.missing.js`, { cwd: fixturesRoot })

        expect(output).to.include(`Cannot find any test files`)
        expect(exitCode).to.not.equal(0)
    })

    it('allows bundling using existing configuration')
    it('ignores existing html-webpack-plugin in webpack configuration')
    it('fails when there are bundling errors')
    it('fails when the page has an error')
})
