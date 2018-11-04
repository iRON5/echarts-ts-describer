// @ts-check
const TurndownService = require('turndown');

const markdown = {
    baseSeeUrl: ``,
    currentItemUrl: ``,
    turndownService: {},

    init(baseSeeUrl) {
        this.baseSeeUrl = baseSeeUrl;

        initService();

        this.turndownService.remove('img');
        this.turndownService.remove('iframe');
        this.turndownService.addRule('fixRelativeLinks', {
            filter: 'a',
            replacement: fixRelativeLinks,
        });
        this.turndownService.addRule('setLinkInsteadLongExample', {
            filter: filterExamples,
            replacement: replaceExamples,
        });
    },
};

module.exports = markdown;

function initService() {
    markdown.turndownService = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '+',
        codeBlockStyle: 'fenced',
    });
}

function fixRelativeLinks(content, node, options) {
    const correctHref = node.getAttribute('href');

    node.href = correctHref.startsWith('http')
        ? correctHref
        : `${this.baseSeeUrl}${correctHref}`;

    const link = options.rules.inlineLink.replacement(content, node, options);

    return `\n${link}\n`;
}

function filterExamples(node) {
    return (
        node.nodeName === 'IMG'
        || node.nodeName === 'IFRAME'
        || (
            node.nodeName === 'PRE'
            && node.textContent.length > 60
        )
    );
}

function replaceExamples(_content, node, options) {
    const a = node.ownerDocument.createElement('a');
    const linkContent = 'see doc';

    a.href = this.currentItemUrl;
    a.textContent = linkContent;

    return fixRelativeLinks(linkContent, a, options);
}
