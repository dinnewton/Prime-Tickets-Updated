import { create } from 'zustand';
import { events as initialEvents } from '../data/events';

const useEventStore = create((set, get) => ({
  events: initialEvents,
  cart: [],
  selectedCategory: 'All',
  searchQuery: '',

  setCategory: (category) => set({ selectedCategory: category }),
  setSearch: (query) => set({ searchQuery: query }),

  getFilteredEvents: () => {
    const { events, selectedCategory, searchQuery } = get();
    return events.filter((e) => {
      const matchesCategory =
        selectedCategory === 'All' || e.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
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

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter((item) => item.id !== itemId) });
  },

  clearCart: () => set({ cart: [] }),

  cartTotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

  cartCount: () =>
    get().cart.reduce((sum, item) => sum + item.quantity, 0),

  // Admin / Vendor actions
  addEvent: (event) => {
    set({ events: [...get().events, { ...event, id: `${Date.now()}` }] });
  },

  updateEvent: (id, updates) => {
    set({
      events: get().events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  },

  deleteEvent: (id) => {
    set({ events: get().events.filter((e) => e.id !== id) });
  },
}));

export default useEventStore;
