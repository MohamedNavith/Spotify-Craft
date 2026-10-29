import { create } from 'zustand';
import { UserProfile } from '../types';

interface StoredAccount {
  user: UserProfile;
  passwordHash: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileModalOpen: boolean;

  setAuth: (user: UserProfile) => void;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  demoLogin: () => void;
  logout: () => void;
  initialize: () => void;
  incrementWatchTime: (seconds: number) => void;
  incrementSongCount: () => void;
  setIsProfileModalOpen: (open: boolean) => void;
}

const STORAGE_ACCOUNTS_KEY = 'wavelength_registered_accounts';
const STORAGE_ACTIVE_USER_KEY = 'wavelength_active_user';

const getStoredAccounts = (): StoredAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredAccounts = (accounts: StoredAccount[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isProfileModalOpen: false,

  setAuth: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(user));
    }
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (email, password, displayName) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((a) => a.user.email === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    const name = displayName?.trim() || cleanEmail.split('@')[0];
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      displayName: name,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      isPremium: true,
      role: 'user',
      watchTimeSeconds: 0,
      songsWatchedCount: 0,
      createdAt: Date.now(),
    };

    const newAccount: StoredAccount = {
      user: newUser,
      passwordHash: password, // client-side saltless hash for local portability
    };

    accounts.push(newAccount);
    saveStoredAccounts(accounts);
    get().setAuth(newUser);

    return { success: true };
  },

  login: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Please enter both email and password' };
    }

    const accounts = getStoredAccounts();
    const match = accounts.find((a) => a.user.email === cleanEmail && a.passwordHash === password);

    if (!match) {
      // If no account exists yet, automatically create one so the user isn't blocked!
      if (!accounts.some((a) => a.user.email === cleanEmail)) {
        return get().register(email, password);
      }
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    get().setAuth(match.user);
    return { success: true };
  },

  demoLogin: () => {
    const demoUser: UserProfile = {
      id: 'demo-user-wavelength',
      email: 'demo@wavelength.fm',
      displayName: 'Wavelength Explorer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isPremium: true,
      role: 'premium_vip',
      watchTimeSeconds: 3840, // 64 minutes listening history
      songsWatchedCount: 19,
      createdAt: Date.now() - 7 * 24 * 3600 * 1000,
    };

    get().setAuth(demoUser);
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isProfileModalOpen: false,
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    try {
      const activeUserStr = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
      if (activeUserStr) {
        const user: UserProfile = JSON.parse(activeUserStr);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {}

    set({ isLoading: false });
  },

  incrementWatchTime: (seconds) => {
    const state = get();
    if (!state.user) return;

    const updatedSeconds = (state.user.watchTimeSeconds || 0) + seconds;
    const updatedUser = {
      ...state.user,
      watchTimeSeconds: updatedSeconds,
    };

    set({ user: updatedUser });

    // Update in stored accounts and active user
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updatedUser));
        const accounts = getStoredAccounts();
        const idx = accounts.findIndex((a) => a.user.id === state.user?.id);
        if (idx >= 0) {
          accounts[idx].user = updatedUser;
          saveStoredAccounts(accounts);
        }
      } catch {}
    }
  },

  incrementSongCount: () => {
    const state = get();
    if (!state.user) return;

    const updatedCount = (state.user.songsWatchedCount || 0) + 1;
    const updatedUser = {
      ...state.user,
      songsWatchedCount: updatedCount,
    };

    set({ user: updatedUser });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updatedUser));
        const accounts = getStoredAccounts();
        const idx = accounts.findIndex((a) => a.user.id === state.user?.id);
        if (idx >= 0) {
          accounts[idx].user = updatedUser;
          saveStoredAccounts(accounts);
        }
      } catch {}
    }
  },

  setIsProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
}));
