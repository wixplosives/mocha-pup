import { spawnSync, SpawnSyncOptions } from 'child_process'

export function runCommand(command: string, options?: SpawnSyncOptions): { output: string, exitCode: number } {
    const [execName, ...args] = command.split(' ')
    const { output, status: exitCode } = spawnSync(execName, args, options)
    return { output: output.join('\n'), exitCode }
}
