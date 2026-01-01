import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DensityMode = 'compact' | 'comfortable' | 'spacious';
type ViewMode = 'list' | 'kanban' | 'grid';
type SidebarTheme = 'light' | 'dark' | 'navy' | 'onyx' | 'glass' | 'glass-vibrant' | 'abstract-dark' | 'minimal' | 'minimal-border' | 'brutalist' | 'cyberpunk' | 'forest' | 'ocean' | 'corporate';
type PageBackground = 'standard' | 'paper' | 'tech' | 'midnight' | 'mesh-gradient' | 'abstract-shapes' | 'soft-aura' | 'noise-texture' | 'aura-dark' | 'geometric' | 'custom';
type FontFamily = 'inter' | 'roboto' | 'poppins' | 'mono' | 'lexend' | 'outfit' | 'montserrat';
type NotificationModel = 'default' | 'modern' | 'minimal';
type NotificationSound = 'none' | 'chime' | 'glass' | 'digital' | 'success' | 'alert';
type PrimaryColor = string;

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type BorderStyle = 'none' | 'soft' | 'marked';
export type ShadowStyle = 'none' | 'light' | 'medium' | 'heavy';

// ... (Filters interfaces remain same)

// Helper: Convert Hex to HSL for Tailwind
function hexToHsl(hex: string): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    // Convert to fractions
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    // Calculate hue
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
}

export interface SavedFilter {
    id: string;
    page: string;
    name: string;
    filters: Record<string, any>;
}

export type LoginStyle = 'glass' | 'glass-v2' | 'modern' | 'classic' | 'minimal' | 'corporate' | 'abstract' | 'video-bg' | 'dynamic-mesh';

interface UISettings {
    sidebarCollapsed: boolean;
    densityMode: DensityMode;
    sidebarTheme: SidebarTheme;
    primaryColor: PrimaryColor;
    savedFilters: SavedFilter[];
    viewPreferences: Record<string, ViewMode>;
    loginStyle: LoginStyle;
    loginBillboard: string;
    pageBackground: PageBackground;
    customBackgroundUrl: string;
    fontFamily: FontFamily;
    logoUrl: string;
    notificationModel: NotificationModel;
    notificationSound: NotificationSound;
    notificationVolume: number;
    enabledAlerts: {
        estoque: boolean;
        vendas: boolean;
        os: boolean;
        financeiro: boolean;
    };
    // AI Theme Tokens
    secondaryColor: string;
    accentColor: string;
    cardBackground: string;
    textColor: string;
    borderRadius: BorderRadius;
    borderStyle: BorderStyle;
    shadowStyle: ShadowStyle;
    titleWeight: string;
    textWeight: string;
}

const defaultSettings: UISettings = {
    sidebarCollapsed: false,
    densityMode: 'comfortable',
    sidebarTheme: 'navy',
    primaryColor: '#2563eb',
    savedFilters: [],
    viewPreferences: {},
    loginStyle: 'glass',
    loginBillboard: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
    pageBackground: 'standard',
    customBackgroundUrl: '',
    fontFamily: 'inter',
    logoUrl: '',
    notificationModel: 'modern',
    notificationSound: 'chime',
    notificationVolume: 0.5,
    enabledAlerts: {
        estoque: true,
        vendas: true,
        os: true,
        financeiro: true,
    },
    // AI Theme Tokens Defaults
    secondaryColor: '#1DB954',
    accentColor: '#F59E0B',
    cardBackground: '#ffffff',
    textColor: '#1a1a1a',
    borderRadius: 'md',
    borderStyle: 'soft',
    shadowStyle: 'light',
    titleWeight: '700',
    textWeight: '400',
};

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
    setLoginPreferences: (style: LoginStyle, billboard: string) => void;
    setPageBackground: (bg: PageBackground) => void;
    setCustomBackgroundUrl: (url: string) => void;
    setFontFamily: (font: FontFamily) => void;
    setLogoUrl: (url: string) => void;
    setNotificationSettings: (settings: Partial<UISettings['enabledAlerts']>) => void;
    setNotificationPreferences: (model: NotificationModel, sound: NotificationSound, volume: number) => void;
    setThemeTokens: (tokens: Partial<UISettings>) => void;
}

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

export function UISettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UISettings>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ui_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        }
        return defaultSettings;
    });

    useEffect(() => {
        try {
            // Now that we resize images to 200px, it is safe to save logoUrl (~50-100kb)
            localStorage.setItem('ui_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save UI settings to localStorage:', error);
        }
    }, [settings]);

    // Apply Primary Color to CSS Variables
    useEffect(() => {
        const root = window.document.documentElement;
        const color = settings.primaryColor;

        // Convert the hex color to HSL
        const hslValue = hexToHsl(color);

        // Calculate a foreground color (simple logic: if generic l < 50, white, else black)
        // For accurate contrast we'd parse the HSL back, but let's stick to a safe default for now or use the calc
        // A simple heuristic for HSL lightness:
        const l = parseFloat(hslValue.split(' ')[2]);
        const foregroundValue = l > 60 ? '0 0% 0%' : '0 0% 100%';

        // Set BRAND colors (used only in Sidebar)
        root.style.setProperty('--brand-primary', hslValue);
        root.style.setProperty('--brand-primary-foreground', foregroundValue);
        root.style.setProperty('--brand-ring', hslValue);

        // Apply secondary and accent
        root.style.setProperty('--secondary-hex', settings.secondaryColor);
        root.style.setProperty('--accent-hex', settings.accentColor);
        root.style.setProperty('--card-bg-hex', settings.cardBackground);
        root.style.setProperty('--text-main-hex', settings.textColor);

    }, [settings.primaryColor, settings.secondaryColor, settings.accentColor, settings.cardBackground, settings.textColor]);

    // Apply UI Styling (Radius, Shadows)
    useEffect(() => {
        const root = window.document.documentElement;

        // Radius mapping
        const radiusMap = {
            none: '0',
            sm: '0.25rem',
            md: '0.5rem',
            lg: '1rem',
            full: '9999px'
        };
        root.style.setProperty('--radius', radiusMap[settings.borderRadius]);

        // Shadow mapping
        const shadowMap = {
            none: 'none',
            light: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            medium: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            heavy: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
        };
        root.style.setProperty('--shadow-premium', shadowMap[settings.shadowStyle]);

        // Border style
        root.style.setProperty('--border-width', settings.borderStyle === 'none' ? '0px' : settings.borderStyle === 'marked' ? '2px' : '1px');

        // Font weights
        root.style.setProperty('--font-weight-title', settings.titleWeight);
        root.style.setProperty('--font-weight-text', settings.textWeight);

    }, [settings.borderRadius, settings.shadowStyle, settings.borderStyle, settings.titleWeight, settings.textWeight]);

    // Apply Font Family
    useEffect(() => {
        const root = window.document.documentElement;
        const font = settings.fontFamily;

        let fontValue = '';
        switch (font) {
            case 'inter': fontValue = '"Inter", sans-serif'; break;
            case 'roboto': fontValue = '"Roboto", sans-serif'; break;
            case 'poppins': fontValue = '"Poppins", sans-serif'; break;
            case 'lexend': fontValue = '"Lexend", sans-serif'; break;
            case 'outfit': fontValue = '"Outfit", sans-serif'; break;
            case 'montserrat': fontValue = '"Montserrat", sans-serif'; break;
            case 'mono': fontValue = '"JetBrains Mono", monospace'; break;
            default: fontValue = '"Inter", sans-serif';
        }

        root.style.setProperty('--font-sans', fontValue);
        document.body.style.fontFamily = fontValue;
    }, [settings.fontFamily]);

    // Apply Page Background (CSS Classes or Variables)
    useEffect(() => {
        const body = document.body;
        // Remove old bg classes (starts with page-bg-)
        body.className = body.className.split(' ').filter(c => !c.startsWith('page-bg-')).join(' ');
        body.classList.add(`page-bg-${settings.pageBackground}`);

        const root = window.document.documentElement;
        // We can also set CSS variables for more complex mesh gradients
        if (settings.pageBackground === 'mesh-gradient') {
            root.style.setProperty('--bg-image', 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)');
        } else {
            root.style.setProperty('--bg-image', 'none');
        }
    }, [settings.pageBackground]);

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

    const setLoginPreferences = (style: LoginStyle, billboard: string) => {
        setSettings(prev => ({ ...prev, loginStyle: style, loginBillboard: billboard }));
    };

    const setPageBackground = (bg: PageBackground) => {
        setSettings(prev => ({ ...prev, pageBackground: bg }));
    };

    const setFontFamily = (font: FontFamily) => {
        setSettings(prev => ({ ...prev, fontFamily: font }));
    };

    const setLogoUrl = (url: string) => {
        setSettings(prev => ({ ...prev, logoUrl: url }));
    };

    const setCustomBackgroundUrl = (url: string) => {
        setSettings(prev => ({ ...prev, customBackgroundUrl: url, pageBackground: url ? 'custom' : prev.pageBackground }));
    };

    const setNotificationSettings = (alerts: Partial<UISettings['enabledAlerts']>) => {
        setSettings(prev => ({ ...prev, enabledAlerts: { ...prev.enabledAlerts, ...alerts } }));
    };

    const setNotificationPreferences = (model: NotificationModel, sound: NotificationSound, volume: number) => {
        setSettings(prev => ({ ...prev, notificationModel: model, notificationSound: sound, notificationVolume: volume }));
    };

    const setThemeTokens = (tokens: Partial<UISettings>) => {
        setSettings(prev => ({ ...prev, ...tokens }));
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
        setLoginPreferences,
        setPageBackground,
        setCustomBackgroundUrl,
        setFontFamily,
        setLogoUrl,
        setNotificationSettings,
        setNotificationPreferences,
        setThemeTokens,
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

export type { DensityMode, ViewMode, SidebarTheme, PrimaryColor, PageBackground, FontFamily };

