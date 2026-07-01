// composables/useTheme.ts
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'rentus-admin-theme';

// Shared reactive state (singleton pattern)
const currentTheme = ref<ThemeMode>('light');
let initialized = false;

function applyTheme(theme: ThemeMode) {
    document.documentElement.setAttribute('data-admin-theme', theme);
    document.documentElement.classList.toggle('dark-admin', theme === 'dark');
}

export function useTheme() {
    if (!initialized) {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (saved === 'dark' || saved === 'light') {
            currentTheme.value = saved;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            currentTheme.value = prefersDark ? 'dark' : 'light';
        }
        applyTheme(currentTheme.value);
        initialized = true;
    }

    const toggleTheme = () => {
        currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, currentTheme.value);
        applyTheme(currentTheme.value);
    };

    const setTheme = (theme: ThemeMode) => {
        currentTheme.value = theme;
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
    };

    const isDark = ref(currentTheme.value === 'dark');

    watch(currentTheme, (val) => {
        isDark.value = val === 'dark';
    });

    return {
        theme: currentTheme,
        isDark,
        toggleTheme,
        setTheme,
    };
}
