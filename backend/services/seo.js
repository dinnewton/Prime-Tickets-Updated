// Search-engine and link-preview support.
//
// The site is a single-page React app, so every URL serves the same HTML.
// WhatsApp, Facebook, X and Google read that HTML without running the app,
// which means a shared event link would preview as a generic page. Here the
// server rewrites the <head> for event pages so a shared link shows the
// event's own title, picture, date and price.
const fs = require('fs');
const path = require('path');
const db = require('../db/store');

const SITE_URL = (process.env.SITE_URL || 'https://primeticketsoko.com').replace(/\/+$/, '');
const SITE_NAME = 'PrimeTickets';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/;

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const absolute = (url) => {
  if (!url) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

/** Today's date (YYYY-MM-DD) in Nairobi, where the events happen. */
function todayInNairobi() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** True until the day after the event. */
function isUpcoming(event) {
  return !event.date || String(event.date).slice(0, 10) >= todayInNairobi();
}

function prettyDate(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00Z`);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function clip(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/** schema.org Event data — lets Google show the event with date, venue and price. */
function eventJsonLd(event, url) {
  const day = String(event.date).slice(0, 10);
  const at = (time) => (/^\d{2}:\d{2}/.test(time || '') ? `${day}T${time.slice(0, 5)}:00+03:00` : day);
  const left = (event.totalTickets ?? 0) - (event.soldTickets ?? 0);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: clip(event.description, 500),
    startDate: at(event.time),
    ...(event.endTime && event.endTime > (event.time || '') ? { endDate: at(event.endTime) } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [absolute(event.image)],
    location: {
      '@type': 'Place',
      name: event.venue,
      address: { '@type': 'PostalAddress', addressLocality: event.city || undefined, addressCountry: 'KE' },
    },
    ...(event.vendorName ? { organizer: { '@type': 'Organization', name: event.vendorName } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      price: event.price,
      priceCurrency: 'KES',
      availability: event.status === 'sold_out' || (event.totalTickets != null && left <= 0)
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    },
  };
  // "<" is escaped so event text can never close the <script> tag
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function eventHead(event) {
  const url = `${SITE_URL}/events/${encodeURIComponent(event.id)}`;
  const title = `${event.title} — Tickets | ${SITE_NAME}`;
  const facts = [prettyDate(event.date), event.venue, event.price ? `Tickets from Ksh ${Number(event.price).toLocaleString('en-KE')}` : '']
    .filter(Boolean).join(' · ');
  const description = clip(`${facts}. ${event.description || ''}`, 200);
  const image = absolute(event.image);

  return `<!--seo-->
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:title" content="${esc(event.title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(event.title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <script type="application/ld+json">${eventJsonLd(event, url)}</script>
    <!--/seo-->`;
}

/**
 * Express handler factory: serves the app's index.html, with the head
 * rewritten when the URL is an event page.
 */
function serveApp(distDir) {
  const indexPath = path.join(distDir, 'index.html');
  return (req, res, next) => {
    fs.readFile(indexPath, 'utf8', (err, html) => {
      if (err) return next(err);
      const match = req.path.match(/^\/events\/([^/]+)\/?$/);
      if (match) {
        const event = db.getEventById(match[1]);
        if (event) html = html.replace(SEO_BLOCK, () => eventHead(event));
        else res.status(404); // the app still loads and shows "Event not found"
      }
      res.type('html').send(html);
    });
  };
}

function robotsTxt(_req, res) {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Allow: /vendor/register',
    'Disallow: /api/',
    'Disallow: /admin',
    'Disallow: /secure/',
    'Disallow: /vendor/',
    'Disallow: /checkout',
    'Disallow: /checkin',
    'Disallow: /payment/',
    'Disallow: /confirmation',
    'Disallow: /my-tickets',
    'Disallow: /reset-password',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n'));
}

function sitemapXml(_req, res) {
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/events`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/market`, changefreq: 'daily', priority: '0.6' },
    { loc: `${SITE_URL}/vendor/register`, changefreq: 'monthly', priority: '0.6' },
    ...['help', 'refunds', 'terms', 'privacy'].map((p) => ({ loc: `${SITE_URL}/${p}`, changefreq: 'monthly', priority: '0.3' })),
    ...db.getEvents()
      .filter((e) => !e.hiddenFromHome && isUpcoming(e))
      .map((e) => ({ loc: `${SITE_URL}/events/${encodeURIComponent(e.id)}`, changefreq: 'daily', priority: '0.8' })),
  ];
  const body = urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
}

module.exports = { serveApp, robotsTxt, sitemapXml, isUpcoming };
