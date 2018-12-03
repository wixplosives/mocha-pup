mocha.setup({ui: mochaOptions.ui, reporter: mochaOptions.reporter, useColors: mochaOptions.useColors})

window.addEventListener('DOMContentLoaded', runTests)

function runTests() {
    const mochaStatus = window.mochaStatus = {
        completed: 0,
        failed: 0,
        finished: false
    }

    mocha.run()
        .on('test end', () => mochaStatus.completed++)
        .on('fail', () => mochaStatus.failed++)
        .on('end', () => mochaStatus.finished = true)
}
