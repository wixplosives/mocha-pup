import { expect } from 'chai';
import { join, resolve } from 'path';
import { spawnAsync } from './spawn-async';

const cliSrcPath = require.resolve('../src/cli.ts');
const fixturesRoot = join(__dirname, '..', 'fixtures');

const runMochaPup = (options: { args: string[]; fixture?: string }) =>
    spawnAsync(
        'node',
        ['-r', '@ts-tools/node/r', cliSrcPath, '--no-colors', '-l', ...options.args.map(arg => `"${arg}"`)],
        { cwd: resolve(fixturesRoot, options.fixture || '.'), shell: true }
    );

describe('mocha-pup', function() {
    this.timeout(20_000);

    it('runs test files specified directly', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./sample.spec.js'] });

        expect(output).to.include('Found 1 test files');
        expect(output).to.include('2 passing');
        expect(exitCode).to.equal(0);
    });

    it('runs test files specified using globs', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./**/*.spec.js'] });

        expect(output).to.include('Found 2 test files');
        expect(output).to.include('3 passing');
        expect(exitCode).to.equal(0);
    });

    it('fails when there are test errors', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./should-fail.unit.js'] });

        expect(output).to.include('1 tests failed');
        expect(output).to.include('some error message');
        expect(exitCode).to.not.equal(0);
    });

    it('fails if not finding test files', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./*.missing.js'] });

        expect(output).to.include('Cannot find any test files');
        expect(exitCode).to.not.equal(0);
    });

    it('automatically finds and uses webpack.config.js', async () => {
        const { output, exitCode } = await runMochaPup({
            args: ['./typescript-file.ts'],
            fixture: 'with-config'
        });

        expect(output).to.include('Found 1 test files');
        expect(output).to.include('1 passing');
        expect(exitCode).to.equal(0);
    });

    it('allows bundling using custom webpack configuration', async () => {
        const { output, exitCode } = await runMochaPup({
            args: ['./typescript-file.ts', '-c', './my.config.js'],
            fixture: 'custom-config'
        });

        expect(output).to.include('Found 1 test files');
        expect(output).to.include('1 passing');
        expect(exitCode).to.equal(0);
    });

    it('fails when there are bundling errors', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./typescript-file.ts'], fixture: 'custom-config' });

        expect(output).to.include('Found 1 test files');
        expect(output).to.include('ERROR in ./typescript-file.ts');
        expect(output).to.include('Module parse failed: Unexpected token');
        expect(output).to.include('You may need an appropriate loader to handle this file type');
        expect(exitCode).to.equal(1);
    });

    it('fails when the page has an error', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./page-error.js'] });

        expect(output).to.include('Found 1 test files');
        expect(output).to.include('Error: outside test');
        expect(exitCode).to.equal(1);
    });

    it('prints console messages in correct order', async () => {
        const { output, exitCode } = await runMochaPup({ args: ['./printer.js'] });

        expect(output).to.include('###before###');
        expect(output).to.include('###after###');
        expect(output.indexOf('###before###'), 'order of messages').to.be.lessThan(output.indexOf('###after###'));
        expect(exitCode).to.equal(0);
    });
});
