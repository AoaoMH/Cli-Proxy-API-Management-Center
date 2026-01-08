/**
 * 主题状态管理
 * 从原项目 src/modules/theme.js 迁移
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';
import { STORAGE_KEY_THEME } from '@/utils/constants';

type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  initializeTheme: () => () => void;
}

const getSystemTheme = (): ResolvedTheme => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const applyTheme = (resolved: ResolvedTheme) => {
  // Force a synchronous DOM update by reading and writing the attribute
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = resolved === 'dark' ? 'dark' : null;
  
  if (targetTheme === 'dark') {
    if (currentTheme !== 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } else {
    if (currentTheme !== null) {
      document.documentElement.removeAttribute('data-theme');
    }
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved: ResolvedTheme = theme === 'auto' ? getSystemTheme() : theme;
        // Apply theme to DOM first, then update state
        applyTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },

      cycleTheme: () => {
        const { theme } = get();
        const order: Theme[] = ['light', 'dark', 'auto'];
        const currentIndex = order.indexOf(theme);
        const nextTheme = order[(currentIndex + 1) % order.length];
        // Directly apply the new theme instead of calling setTheme via get()
        const resolved: ResolvedTheme = nextTheme === 'auto' ? getSystemTheme() : nextTheme;
        applyTheme(resolved);
        set({ theme: nextTheme, resolvedTheme: resolved });
      },

      initializeTheme: () => {
        const { theme } = get();

        // 应用已保存的主题
        const resolved: ResolvedTheme = theme === 'auto' ? getSystemTheme() : theme;
        applyTheme(resolved);
        set({ resolvedTheme: resolved });

        // 监听系统主题变化（仅在 auto 模式下生效）
        if (!window.matchMedia) {
          return () => {};
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
          const { theme: currentTheme } = get();
          if (currentTheme === 'auto') {
            const newResolved = getSystemTheme();
            applyTheme(newResolved);
            set({ resolvedTheme: newResolved });
          }
        };

        mediaQuery.addEventListener('change', listener);

        return () => mediaQuery.removeEventListener('change', listener);
      },
    }),
    {
      name: STORAGE_KEY_THEME,
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after rehydration from localStorage
        if (state) {
          const resolved: ResolvedTheme = state.theme === 'auto' ? getSystemTheme() : state.theme;
          applyTheme(resolved);
        }
      },
    }
  )
);
