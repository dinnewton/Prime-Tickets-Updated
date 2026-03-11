import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockAccounts } from '../data/users';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email, password) => {
        const account = mockAccounts.find(
          (a) => a.email === email && a.password === password
        );
        if (account) {
          const { password: _, ...user } = account;
          set({ user, isAuthenticated: true });
          return { success: true, role: user.role };
        }
        return { success: false, error: 'Invalid email or password' };
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      register: (data) => {
        // In a real app this would call an API
        const newUser = {
          id: `u${Date.now()}`,
          ...data,
          role: 'client',
        };
        set({ user: newUser, isAuthenticated: true });
        return { success: true };
      },

      registerVendor: (data) => {
        const newVendor = {
          id: `v${Date.now()}`,
          ...data,
          role: 'vendor',
          vendorId: `v${Date.now()}`,
          status: 'pending',
        };
        set({ user: newVendor, isAuthenticated: true });
        return { success: true };
      },
    }),
    {
      name: 'prime-tickets-auth',
    }
  )
);

export default useAuthStore;
