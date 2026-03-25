import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const res = await authApi.login(email, password);
          set({ user: res.user, token: res.token, isAuthenticated: true });
          return { success: true, role: res.user.role };
        } catch (e1) {
          if (e1.status === 401 || e1.status === 403) {
            try {
              const res = await authApi.vendorLogin(email, password);
              const user = { ...res.vendor, role: 'vendor' };
              set({ user, token: res.token, isAuthenticated: true });
              return { success: true, role: 'vendor' };
            } catch (e2) {
              return { success: false, error: e2.status === 403 ? e2.message : 'Invalid email or password' };
            }
          }
          return { success: false, error: e1.status === 403 ? e1.message : 'Invalid email or password' };
        }
      },

      adminLogin: async (email, password) => {
        try {
          const res = await authApi.login(email, password);
          if (res.user.role !== 'admin') {
            return { success: false, error: 'Access denied. Admin credentials required.' };
          }
          set({ user: res.user, token: res.token, isAuthenticated: true });
          return { success: true, role: 'admin' };
        } catch (e) {
          return { success: false, error: e.message || 'Invalid credentials' };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      register: async (data) => {
        try {
          const res = await authApi.register(data);
          set({ user: res.user, token: res.token, isAuthenticated: true });
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message || 'Registration failed' };
        }
      },

      registerVendor: async (data) => {
        try {
          const res = await authApi.vendorRegister(data);
          const user = { ...res.vendor, role: 'vendor' };
          set({ user, token: res.token, isAuthenticated: true });
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message || 'Registration failed' };
        }
      },
    }),
    { name: 'prime-auth' }
  )
);

export default useAuthStore;
