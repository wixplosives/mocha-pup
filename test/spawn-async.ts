import { spawn, SpawnOptions } from 'child_process';

export interface ISpawnAsyncOptions extends SpawnOptions {
    pipeStreams?: boolean;
}

export async function spawnAsync(command: string, args: ReadonlyArray<string> = [], options: ISpawnAsyncOptions = {}) {
    return new Promise<{ exitCode: number; output: string }>((res, rej) => {
        const childProcess = spawn(command, args, options);
        const output: Array<string | Buffer> = [];
        childProcess.once('error', rej);

        const captureOutput = (chunk: string | Buffer) => {
            console.log(chunk.toString());
            output.push(chunk);
        };
        childProcess.stdout.on('data', captureOutput);
        childProcess.stderr.on('data', captureOutput);

        if (options.pipeStreams) {
            childProcess.stdout.pipe(process.stdout);
            childProcess.stderr.pipe(process.stderr);
        }
        childProcess.once('exit', exitCode => res({ output: output.join(), exitCode: exitCode || 0 }));
    });
}
