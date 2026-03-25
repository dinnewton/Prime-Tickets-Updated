import { create } from 'zustand';
import { eventsApi } from '../services/api';
import { events as fallbackEvents } from '../data/events';

const useEventStore = create((set, get) => ({
  events: fallbackEvents, // start with mock data so UI renders instantly
  loading: false,
  cart: [],
  selectedCategory: 'All',
  searchQuery: '',

  /** Fetch events from the backend and replace local state */
  fetchEvents: async () => {
    set({ loading: true });
    try {
      const data = await eventsApi.list();
      set({ events: data, loading: false });
    } catch {
      // Keep fallback data if API is unreachable
      set({ loading: false });
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSearch: (query) => set({ searchQuery: query }),

  getFilteredEvents: () => {
    const { events, selectedCategory, searchQuery } = get();
    return events.filter((e) => {
      const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  },

  addToCart: (event, ticketType, quantity) => {
    const { cart } = get();
    const existing = cart.find(
      (item) => item.eventId === event.id && item.ticketType === ticketType
    );
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.eventId === event.id && item.ticketType === ticketType
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            id: `${event.id}-${ticketType}-${Date.now()}`,
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
            venue: event.venue,
            image: event.image,
            ticketType,
            price: ticketType === 'vip' ? event.vipPrice : event.price,
            quantity,
          },
        ],
      });
    }
  },

  removeFromCart: (itemId) => set({ cart: get().cart.filter((item) => item.id !== itemId) }),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

  /** Create event via API, then add to local state */
  addEvent: async (event) => {
    try {
      const created = await eventsApi.create(event);
      set({ events: [...get().events, created] });
      return { success: true, event: created };
    } catch (e) {
      // Optimistic fallback for offline dev
      const local = { ...event, id: `${Date.now()}` };
      set({ events: [...get().events, local] });
      return { success: true, event: local };
    }
  },

  /** Update event via API */
  updateEvent: async (id, updates) => {
    try {
      const updated = await eventsApi.update(id, updates);
      set({ events: get().events.map((e) => (e.id === id ? updated : e)) });
      return { success: true };
    } catch {
      set({ events: get().events.map((e) => (e.id === id ? { ...e, ...updates } : e)) });
      return { success: true };
    }
  },

  /** Delete event via API */
  deleteEvent: async (id) => {
    try {
      await eventsApi.delete(id);
    } catch {
      // continue with local delete even if API fails
    }
    set({ events: get().events.filter((e) => e.id !== id) });
  },
}));

export default useEventStore;
