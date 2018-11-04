// @ts-check
const fs = require('fs');
const stream = require('stream');

const fileWriter = {
    sourceDir: './dist',
    progressBar: {},

    init(progressBar) {
        this.progressBar = progressBar;
    },

    async writeItemsToFile(interfaces) {
        let count;
        const barTracker = fileWriter.progressBar.createWriteStream(() => ({ count }));
        const reader = new SafeReadable({ read() {} });

        reader.safePipe(barTracker).on('finish', () => fileWriter.progressBar.completePercent = 1);


        for (let i = 0; i < interfaces.length; i++) {
            const interface = interfaces[i];
            const fileStream = getFileForWrite(interface, reader);
            const jsonLines = interface.split('\n');

            count = jsonLines.length;

            await write(jsonLines, reader);

            reader.unpipe(fileStream);
            fileStream.end();
        }

        reader.push(null);
    }
};

module.exports = fileWriter;

function getFileForWrite(interface, readStream) {
    const interfaceName = interface.match(/interface (.+) {/)[1];
    const fileName = `${fileWriter.sourceDir}/echarts.${interfaceName}.d.ts`;
    const fileStream = fs.createWriteStream(fileName);

    readStream.safePipe(fileStream);

    fileWriter.progressBar.processMessage = `Writing file "${fileName}..."`;

    return fileStream;
}

class SafeReadable extends stream.Readable {
    safePipe(writable) {
        return this.pipe(writable).on('error', err => {
            console.trace(err);
        });
    }
}

async function write(jsonByLines, reader) {
    for (let i = 0; i < jsonByLines.length; i++) {
        const line = jsonByLines[i];

        await new Promise(res => {
            setTimeout(() => {
                reader.push(`${line}\n`);
                res();
            });
        });
    }
}
