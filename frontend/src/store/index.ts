import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  tenantMemberships: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
    set({ token, isAuthenticated: !!token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

interface AppState {
  selectedCustomerId: string | null;
  customers: any[];
  setSelectedCustomerId: (id: string | null) => void;
  setCustomers: (customers: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCustomerId: null,
  customers: [],
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  setCustomers: (customers) => set({ customers }),
}));
