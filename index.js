// @ts-check
// @ts-ignore
const rawData = require('./echarts-series.json');
const markdown = require('./helpers/markdown');
const progressBar = require('./helpers/progress-bar');
const tsGenerator = require('./helpers/ts-generator');
const fileWriter = require('./helpers/file-writer');

const params = {
    optionType: 'series',
    baseSeeUrl: 'https://ecomfe.github.io/echarts-doc/public/en/option.html',
};

main();

function main() {
    markdown.init(params.baseSeeUrl);
    progressBar.init(rawData.length * 3);
    tsGenerator.init(params.optionType, params.baseSeeUrl, progressBar);
    fileWriter.init(progressBar);

    progressBar.processMessage = 'Transforming...';

    processItems(rawData)
        .then(fileWriter.writeItemsToFile)
        .then(() => console.log('\ncomplete\n'))
        .catch(err => {
            console.trace(err);
        })
}

async function processItems(items, nested, path = ``) {
    const result = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const currentPath = path || item.typeEnum;

        item.description = await transformHTML(item.description, currentPath);

        updateStatusMessage(i, items.length, item.typeEnum);
        await processItemChildren(currentPath, item);
        progressBar.updateProgressBar(!nested);

        if (item.typeEnum) {
            const interface = await tsGenerator.restructure(item);

            result.push(interface);
        }
    }

    return result.length ? result : items;
}

function transformHTML(html, path) {
    return new Promise(res => {
        setTimeout(() => {
            markdown.currentItemUrl = `${params.baseSeeUrl}#${params.optionType}-${path}`;

            // @ts-ignore
            const result = markdown.turndownService.turndown(html);

            res(
                result
                    .replace(/ {2,}/g, ' ')
                    .replace(/\n( ?\n)+/g, '\n\n')
                    .replace(/ +\n/, '\n')
            );
        });
    });
}

function updateStatusMessage(currentState, total, value) {
    progressBar.updateStatus = value
        ? `${currentState + 1}/${total} • ${value}`
        : progressBar.updateStatus;
}

async function processItemChildren(currentPath, item) {
    if (!item.children) {
        return;
    }

    const newPath = currentPath
        ? `${currentPath}.${item.typeEnum || encodeURIComponent(item.propertyName)}`
        : currentPath;

    item.children = await processItems(item.children, true, newPath);
}
