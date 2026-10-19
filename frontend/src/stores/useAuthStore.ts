import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wavelength_token', accessToken);
      localStorage.setItem('wavelength_refresh_token', refreshToken);
      localStorage.setItem('wavelength_user', JSON.stringify(user));
    }
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wavelength_token');
      localStorage.removeItem('wavelength_refresh_token');
      localStorage.removeItem('wavelength_user');
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('wavelength_token');
      const refreshToken = localStorage.getItem('wavelength_refresh_token');
      const userStr = localStorage.getItem('wavelength_user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Ignore parse errors
    }

    set({ isLoading: false });
  },
}));
