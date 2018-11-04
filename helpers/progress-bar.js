// @ts-check
const ProgressBar = require('progress');
const stream = require('stream');

const progressBar = {
    bar: {},
    updateStatus: ``,
    processMessage: ``,
    completePercent: 0,
    totalLength: 0,

    init(totalLength) {
        this.totalLength = totalLength;

        // it should be updated with `update` for more precise output
        this.bar = new ProgressBar(':percent [:bar]  • :updateStatus', {
            width: 50,
            total: progressBar.totalLength,
            complete: '\u001b[42m \u001b[0m' // green
        });

        updateBar();
    },
    updateProgressBar(shouldUpdate = true) {
        if (shouldUpdate) {
            this.completePercent += 1 / this.totalLength;
        }
    },
    createWriteStream(getCounts) {
        let { count } = getCounts();

        return new stream.Writable({
            write(_c, _e, done) {
                if (count) {
                    progressBar.updateProgressBar();
                    count--;
                }

                done();
            }
        });
    },
};

module.exports = progressBar;

function updateBar() {
    setTimeout(() => {
        if (progressBar.processMessage) {
            progressBar.bar.interrupt(progressBar.processMessage);
            progressBar.processMessage = '';
        }

        if (!progressBar.bar.complete) {
            progressBar.bar.update(progressBar.completePercent, {
                updateStatus: progressBar.updateStatus,
            });

            return updateBar();
        }
    }, 20);
}
