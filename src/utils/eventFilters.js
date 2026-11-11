// Filtering and sorting shared by the homepage rows and the events page.
// Event dates are plain YYYY-MM-DD strings and are compared in Nairobi time.

export const WHEN_OPTIONS = [
  { id: 'all',     label: 'All dates' },
  { id: 'today',   label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'month',   label: 'Next 30 days' },
];

export const PRICE_OPTIONS = [
  { id: 'any',     label: 'Any price' },
  { id: 'under2k', label: 'Under Ksh 2,000',     test: (p) => p < 2000 },
  { id: '2k-5k',   label: 'Ksh 2,000 – 5,000',   test: (p) => p >= 2000 && p <= 5000 },
  { id: '5kplus',  label: 'Over Ksh 5,000',      test: (p) => p > 5000 },
];

export const SORT_OPTIONS = [
  { id: 'soonest',    label: 'Date: soonest first' },
  { id: 'price-low',  label: 'Price: low to high' },
  { id: 'price-high', label: 'Price: high to low' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

/** A Date whose UTC fields read as Nairobi local time, `addDays` from today. */
function nairobiDay(addDays = 0) {
  return new Date(Date.now() + NAIROBI_OFFSET_MS + addDays * DAY_MS);
}
const ymd = (d) => d.toISOString().slice(0, 10);

/** First and last date (inclusive, YYYY-MM-DD) for a "when" option; null = no limit. */
export function dateRange(when) {
  const today = nairobiDay();
  if (when === 'today') return [ymd(today), ymd(today)];
  if (when === 'month') return [ymd(today), ymd(nairobiDay(30))];
  if (when === 'weekend') {
    // Friday to Sunday. From Friday onwards it is "the rest of this weekend".
    const dow = today.getUTCDay(); // 0 Sun … 6 Sat
    if (dow === 0) return [ymd(today), ymd(today)];
    const toFriday = dow >= 5 ? 0 : 5 - dow;
    return [ymd(nairobiDay(toFriday)), ymd(nairobiDay(7 - dow))];
  }
  return null;
}

const dayOf = (event) => String(event.date || '').slice(0, 10);

export function filterEvents(events, { q = '', category = 'All', when = 'all', price = 'any' } = {}) {
  const needle = q.trim().toLowerCase();
  const range = dateRange(when);
  const priceTest = PRICE_OPTIONS.find((p) => p.id === price)?.test;

  return events.filter((e) => {
    if (category !== 'All' && e.category !== category) return false;
    if (range && (dayOf(e) < range[0] || dayOf(e) > range[1])) return false;
    if (priceTest && !priceTest(Number(e.price) || 0)) return false;
    if (needle && ![e.title, e.venue, e.city, e.category, e.vendorName]
      .some((v) => (v || '').toLowerCase().includes(needle))) return false;
    return true;
  });
}

export function sortEvents(events, sort = 'soonest') {
  const byDate = (a, b) => `${dayOf(a)} ${a.time || ''}`.localeCompare(`${dayOf(b)} ${b.time || ''}`);
  const list = [...events];
  if (sort === 'price-low')  return list.sort((a, b) => (a.price || 0) - (b.price || 0) || byDate(a, b));
  if (sort === 'price-high') return list.sort((a, b) => (b.price || 0) - (a.price || 0) || byDate(a, b));
  return list.sort(byDate);
}
