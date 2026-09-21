/**
 * Content extractor - Extract clean content from URLs
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import Turndown from 'turndown';
const turndown = new Turndown();
export async function extractContent(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SciClaw/2.0)',
        },
        timeout: 30000,
    });
    const $ = cheerio.load(response.data);
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .ads, .sidebar').remove();
    // Extract main content
    const mainContent = $('main, article, .content, #content, .post, .article').first();
    const content = mainContent.length ? mainContent.html() : $('body').html();
    if (!content) {
        throw new Error('No content found');
    }
    // Convert to markdown
    return turndown.turndown(content);
}
export async function extractMultiple(urls) {
    const results = new Map();
    await Promise.all(urls.map(async (url) => {
        try {
            const content = await extractContent(url);
            results.set(url, content);
        }
        catch (error) {
            console.warn(`Failed to extract ${url}: ${error}`);
        }
    }));
    return results;
}
export { extractContent as default };
//# sourceMappingURL=index.js.map