import { useEffect } from 'react';

const DEFAULT_TITLE = 'PrimeTickets — Event Tickets in Kenya | Concerts, Sports, Comedy & More';

/** Sets the browser tab title for a page; restores the default when leaving. */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | PrimeTickets` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
