// API key for requests.
const API_KEY = '';

// That's it! You shouldn't need to change anything below here unless you really want to.

// These are the user agents that the worker will look for to
// initiate prerendering of the site.
const BOT_AGENTS = [
    'applebot',
    'baiduspider',
    'bingbot',
    'bitlybot',
    'bitrix link preview',
    'chrome-lighthouse',
    'developers.google.com/+/web/snippet',
    'discordbot',
    'embedly',
    'facebookexternalhit',
    'flipboard',
    'google page speed',
    'googlebot',
    'linkedinbot',
    'lynx/',
    'nuzzel',
    'outbrain',
    'pinterest/0.',
    'pinterestbot',
    'quora link preview',
    'qwantify',
    'redditbot',
    'rogerbot',
    'showyoubot',
    'skypeuripreview',
    'slackbot',
    'telegrambot',
    'tumblr',
    'twitterbot',
    'vkshare',
    'w3c_validator',
    'whatsapp',
    'xing-contenttabreceiver',
    'yahoo! slurp',
    'yandex',
];

// These are the extensions that the worker will skip prerendering
// even if any other conditions pass.
// NOTE: You may want to add .json here
const IGNORE_EXTENSIONS = [
    '.ai',
    '.avi',
    '.avif',
    '.css',
    '.dat',
    '.dmg',
    '.doc',
    '.doc',
    '.eot',
    '.exe',
    '.flv',
    '.gif',
    '.ico',
    '.iso',
    '.jpeg',
    '.jpg',
    '.js',
    '.less',
    '.m4a',
    '.m4v',
    '.mov',
    '.mp3',
    '.mp4',
    '.mpeg',
    '.mpg',
    '.ogg',
    '.opus',
    '.otf',
    '.pdf',
    '.png',
    '.ppt',
    '.psd',
    '.rar',
    '.rss',
    '.svg',
    '.swf',
    '.tif',
    '.torrent',
    '.ttc',
    '.ttf',
    '.txt',
    '.wav',
    '.webm',
    '.webmanifest',
    '.webp',
    '.wmv',
    '.woff',
    '.woff2',
    '.xls',
    '.xml',
    '.zip',
];

/**
 * This attaches the event listener that gets invoked when CloudFlare receives
 * a request.
 */
addEventListener('fetch', event => {
    const {request} = event;
    const requestUserAgent = (request.headers.get('User-Agent') || '').toLowerCase();
    const xPrerender = request.headers.get('X-Prerender');
    const url = new URL(request.url);
    const pathName = url.pathname.toLowerCase();
    const ext = pathName.substring(pathName.lastIndexOf('.') || pathName.length);

    if (
        !xPrerender
        && BOT_AGENTS.some(e => requestUserAgent.includes(e))
        && !IGNORE_EXTENSIONS.some(e => e === ext)
        && /^https?:\/\//.test(request.url)
    ) {
        event.respondWith(prerenderRequest(request));
    }
});

/**
 * Function to request the prerendered version of a request.
 *
 * @param {Request} request - The request received by CloudFlare
 * @returns {Promise<Response>}
 */
function prerenderRequest(request) {
    const {url, headers} = request;
    const base = 'https://api.rendermy.site';
    const prerenderUrl = `${base}/${url}`;

    const headersToSend = new Headers(headers);
    headersToSend.set('X-Prerender-Token', API_KEY);

    const prerenderRequest = new Request(prerenderUrl, {
        headers: headersToSend,
        redirect: 'manual',
    });

    // Cache for 1 day
    // See: https://developers.cloudflare.com/workers/runtime-apis/request/#requestinitcfproperties
    return fetch(prerenderRequest, {cf: {cacheTtl: 24 * 60 * 60 }});
}
