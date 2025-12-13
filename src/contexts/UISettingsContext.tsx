import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DensityMode = 'compact' | 'comfortable' | 'spacious';
type ViewMode = 'list' | 'kanban' | 'grid';
type SidebarTheme = 'light' | 'dark' | 'navy' | 'onyx';
type PrimaryColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

interface Filter {
    field: string;
    operator: string;
    value: any;
}

interface SavedFilter {
    id: string;
    name: string;
    filters: Filter[];
    page: string;
}

interface UISettings {
    sidebarCollapsed: boolean;
    densityMode: DensityMode;
    sidebarTheme: SidebarTheme;
    primaryColor: PrimaryColor;
    savedFilters: SavedFilter[];
    viewPreferences: Record<string, ViewMode>;
}

interface UISettingsContextType extends UISettings {
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setDensityMode: (mode: DensityMode) => void;
    setSidebarTheme: (theme: SidebarTheme) => void;
    setPrimaryColor: (color: PrimaryColor) => void;
    saveFilter: (filter: SavedFilter) => void;
    removeFilter: (id: string) => void;
    getFiltersForPage: (page: string) => SavedFilter[];
    setViewPreference: (page: string, view: ViewMode) => void;
    getViewPreference: (page: string) => ViewMode;
}

const defaultSettings: UISettings = {
    sidebarCollapsed: false,
    densityMode: 'comfortable',
    sidebarTheme: 'navy',
    primaryColor: 'blue',
    savedFilters: [],
    viewPreferences: {},
};

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'acr-ui-settings';

// Color palettes for dynamic injection
const COLOR_PALETTES: Record<PrimaryColor, any> = {
    blue: {
        DEFAULT: '221.2 83.2% 53.3%', // #3b82f6 (blue-500)
        foreground: '210 40% 98%',
    },
    purple: {
        DEFAULT: '262.1 83.3% 57.8%', // #8b5cf6 (violet-500)
        foreground: '210 40% 98%',
    },
    green: {
        DEFAULT: '142.1 76.2% 36.3%', // #16a34a (green-600)
        foreground: '355.7 100% 97.3%',
    },
    orange: {
        DEFAULT: '24.6 95% 53.1%', // #f97316 (orange-500)
        foreground: '60 9.1% 97.8%',
    },
    red: {
        DEFAULT: '0 84.2% 60.2%', // #ef4444 (red-500)
        foreground: '210 40% 98%',
    },
    pink: {
        DEFAULT: '317 83% 60%', // #ec4899 (pink-500)
        foreground: '210 40% 98%',
    }
};

export function UISettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UISettings>(() => {
        // Load from localStorage on init
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    return { ...defaultSettings, ...JSON.parse(stored) };
                } catch (e) {
                    console.error('Failed to parse UI settings:', e);
                }
            }
        }
        return defaultSettings;
    });

    // Load remote preferences on mount
    useEffect(() => {
        const loadRemoteSettings = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('system_config')
                    .select('settings')
                    .eq('key', 'appearance')
                    .single();

                if (data?.settings) {
                    const appearance = data.settings;
                    if (appearance.primary_color) {
                        setSettings(prev => ({
                            ...prev,
                            primaryColor: appearance.primary_color
                        }));
                    }
                    if (appearance.sidebar_theme) {
                        setSettings(prev => ({
                            ...prev,
                            sidebarTheme: appearance.sidebar_theme
                        }));
                    }
                }
            } catch (err) {
                console.error("Error loading remote settings:", err);
            }
        };
        loadRemoteSettings();
    }, []);

    // Persist to localStorage whenever settings change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    }, [settings]);

    // Apply Primary Color to CSS Variables
    useEffect(() => {
        const root = window.document.documentElement;
        const color = settings.primaryColor;
        const palette = COLOR_PALETTES[color];

        if (palette) {
            root.style.setProperty('--primary', palette.DEFAULT);
            root.style.setProperty('--primary-foreground', palette.foreground);
            root.style.setProperty('--ring', palette.DEFAULT);
            // We can add more variables (50-900) here if needed for full Tailwind palette swap
        }
    }, [settings.primaryColor]);

    const toggleSidebar = () => {
        setSettings(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
    };

    const setSidebarCollapsed = (collapsed: boolean) => {
        setSettings(prev => ({ ...prev, sidebarCollapsed: collapsed }));
    };

    const setDensityMode = (mode: DensityMode) => {
        setSettings(prev => ({ ...prev, densityMode: mode }));
    };

    const setSidebarTheme = (theme: SidebarTheme) => {
        setSettings(prev => ({ ...prev, sidebarTheme: theme }));
    };

    const setPrimaryColor = (color: PrimaryColor) => {
        setSettings(prev => ({ ...prev, primaryColor: color }));
    };

    const saveFilter = (filter: SavedFilter) => {
        setSettings(prev => ({
            ...prev,
            savedFilters: [...prev.savedFilters.filter(f => f.id !== filter.id), filter],
        }));
    };

    const removeFilter = (id: string) => {
        setSettings(prev => ({
            ...prev,
            savedFilters: prev.savedFilters.filter(f => f.id !== id),
        }));
    };

    const getFiltersForPage = (page: string) => {
        return settings.savedFilters.filter(f => f.page === page);
    };

    const setViewPreference = (page: string, view: ViewMode) => {
        setSettings(prev => ({
            ...prev,
            viewPreferences: { ...prev.viewPreferences, [page]: view },
        }));
    };

    const getViewPreference = (page: string): ViewMode => {
        return settings.viewPreferences[page] || 'list';
    };

    const value: UISettingsContextType = {
        ...settings,
        toggleSidebar,
        setSidebarCollapsed,
        setDensityMode,
        setSidebarTheme,
        setPrimaryColor,
        saveFilter,
        removeFilter,
        getFiltersForPage,
        setViewPreference,
        getViewPreference,
    };

    return (
        <UISettingsContext.Provider value={value}>
            {children}
        </UISettingsContext.Provider>
    );
}

export function useUISettings() {
    const context = useContext(UISettingsContext);
    if (context === undefined) {
        throw new Error('useUISettings must be used within a UISettingsProvider');
    }
    return context;
}

export type { DensityMode, ViewMode, Filter, SavedFilter, SidebarTheme, PrimaryColor };

