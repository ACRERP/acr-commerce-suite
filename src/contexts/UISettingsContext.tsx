import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DensityMode = 'compact' | 'comfortable' | 'spacious';
type ViewMode = 'list' | 'kanban' | 'grid';

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
    savedFilters: SavedFilter[];
    viewPreferences: Record<string, ViewMode>;
}

interface UISettingsContextType extends UISettings {
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setDensityMode: (mode: DensityMode) => void;
    saveFilter: (filter: SavedFilter) => void;
    removeFilter: (id: string) => void;
    getFiltersForPage: (page: string) => SavedFilter[];
    setViewPreference: (page: string, view: ViewMode) => void;
    getViewPreference: (page: string) => ViewMode;
}

const defaultSettings: UISettings = {
    sidebarCollapsed: false,
    densityMode: 'comfortable',
    savedFilters: [],
    viewPreferences: {},
};

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'acr-ui-settings';

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

    // Persist to localStorage whenever settings change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    }, [settings]);

    const toggleSidebar = () => {
        setSettings(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
    };

    const setSidebarCollapsed = (collapsed: boolean) => {
        setSettings(prev => ({ ...prev, sidebarCollapsed: collapsed }));
    };

    const setDensityMode = (mode: DensityMode) => {
        setSettings(prev => ({ ...prev, densityMode: mode }));
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

export type { DensityMode, ViewMode, Filter, SavedFilter };
