// @ts-check
const tsGenerator = {
    baseSeeUrl: ``,
    optionType: ``,
    progressBar: {},

    init(optionType, baseSeeUrl, progressBar) {
        this.optionType = optionType;
        this.baseSeeUrl = baseSeeUrl;
        this.progressBar = progressBar;
    },

    async restructure(item) {
        this.progressBar.processMessage = `Generating interface ${item.typeEnum}...`;

        const tsInterface = await generateTsInterface(item);

        this.progressBar.updateProgressBar();

        return tsInterface;
    },
};

module.exports = tsGenerator;

async function generateTsInterface(item) {
    tsGenerator.progressBar.processMessage = `    Creating ${item.typeEnum} Interface comment...`;

    const comment = await getPropertyComment(item, 0, item.typeEnum);
    const tsInterface = `${comment}\ninterface $name {$props\n}\n`;
    const capitalizedName = item.typeEnum[0].toUpperCase() + item.typeEnum.slice(1);
    let props = ``;

    for (let i = 0; i < item.children.length; i++) {
        const child = item.children[i];
        const path = `${item.typeEnum}.${encodeURIComponent(child.propertyName)}`;

        props += await getTsProps(child, 1, path);
    }

    return tsInterface
        .replace(/\$name/, capitalizedName)
        .replace(/\$props/, props);
}

async function getTsProps(item, nesting, path) {
    tsGenerator.progressBar.updateStatus = path;

    const tabs = '    '.repeat(nesting);
    const comment = await getPropertyComment(item, nesting, path);
    const property = item.propertyName === `<user defined style name>`
        ? '[userStyle: string]'
        : `${item.propertyName}?`;
    const prefix = `\n\n${comment}\n${tabs}${property}:`;

    if (!item.children) {
        return `${prefix} ${getCorrectType(item)};`;
    }

    let propsText = ``;

    for (let i = 0; i < item.children.length; i++) {
        const child = item.children[i];
        const newPath = `${path}.${encodeURIComponent(child.propertyName)}`;

        propsText += await getTsProps(child, nesting + 1, newPath);
    }

    return `${prefix} {${propsText}\n${tabs}};`;
}

async function getPropertyComment(item, nesting, path) {
    const tabs = '    '.repeat(nesting);
    const base = `${tabs}/**\n$text\n${tabs} */`;
    const commentText = await parseCommentText(item, nesting, path);

    return base.replace(/\$text/, commentText);
}

async function parseCommentText(item, nesting, path) {
    const tabs = '    '.repeat(nesting);
    const prefix = `${tabs} *`;
    let commentText = ``;
    let fullText = item.description;

    while (fullText.length) {
        const text = await getNextLine(prefix.length + 1, fullText);
        const shift = getCommentShift(text);
        const correctLine = text.trim().concat('\n');

        fullText = fullText.slice(shift);

        const textWithSpace = correctLine !== '\n'
            ? ` ${correctLine}`
            : correctLine;

        commentText += `${prefix}${textWithSpace}`;
    }

    const lineBreak = commentText.length ? `\n${prefix}\n` : '';

    commentText += `${lineBreak}${await createJSDoc(item, nesting, path)}`;

    return commentText.replace(/\n\n/g, `\n${prefix}\n`);
}

async function getNextLine(prefixLen, fullText) {
    await new Promise(res => { setTimeout(res); });

    if (fullText.slice(0, 2) === '\n\n') {
        return '\n';
    }

    const prefix = fullText.match(/^ *\n? */)[0];
    const safeText = fullText.trimLeft();
    const firstLine = safeText.slice(0, 300).split('\n')[0];
    const isLink = /\[.+?\]\(https.+?\)/.test(firstLine);
    const maxLength = 72 - prefixLen;

    if (isLink || firstLine.length <= maxLength) {
        return `${prefix}${firstLine}`;
    }

    const dotCropIndex = firstLine.includes('.')
        ? firstLine.indexOf('.')
        : maxLength;
    const cropIndex = dotCropIndex > maxLength
        ? maxLength
        : dotCropIndex;


    // cut a sentence otherwise cut ~65 chars
    const crop = firstLine.slice(0, cropIndex);

    // get word end if it was split in the middle
    const wordEnd = /[^ .,]/.test(crop.slice(-1))
        ? safeText.slice(cropIndex, cropIndex + 40).split(/ |\n/)[0]
        : '';

    return `${prefix}${crop}${wordEnd}`;
}

function getCommentShift(text) {
    return text === '\n'
        ? 2 // single \n means that it was squashed from 2
        : text.length || 1;
}

async function createJSDoc(item, nesting = 1, path) {
    await new Promise(res => { process.nextTick(res); });

    const tabs = '    '.repeat(nesting);
    const prefix = `${tabs} *`;
    let doc = ``;

    if (item.defau && item.defau.default) {
        const defaultValue = getCorrectDefaultValue(item.defaultValueText);

        doc += `${prefix} @default\n${prefix} ${defaultValue}`;
    }

    const lineBreak = doc.length ? '\n' : '';

    doc += `${lineBreak}${getLinkToDoc(nesting, path)}`;

    return doc;
}

function getCorrectDefaultValue(defaultValue) {
    if (/[a-zA-Z]+/.test(defaultValue)) {
        // rewrap strings as they could being without quotes
        return `"${defaultValue.replace("'", '')}"`;
    }

    return defaultValue;
}

function getLinkToDoc(nesting, path) {
    const tabs = '    '.repeat(nesting);
    const prefix = `${tabs} *`;

    return `${prefix} @see ${tsGenerator.baseSeeUrl}#${tsGenerator.optionType}-${path}`;
}

function getCorrectType(item) {
    const type = item.type.sort ? item.type.sort() : item.type;

    return type
        .toString()
        .split(',')
        .join(' | ')
        .toLowerCase()
        .replace('array', 'any[]')
        .replace('*', 'any')
        .replace('color', 'string')
        .replace('numbr', 'number');
}

