import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BusinessProfile, businessProfiles } from '@/config/business-profiles';
import { useUISettings } from './UISettingsContext';

interface BusinessProfileContextType {
    activeProfile: BusinessProfile | null;
    activeVariant: 'vibrant' | 'clean' | 'dark';
    setProfile: (profileId: string, variant?: 'vibrant' | 'clean' | 'dark') => void;
    setVariant: (variant: 'vibrant' | 'clean' | 'dark') => void;
    resetProfile: () => void;
    isLoading: boolean;
    profiles: BusinessProfile[];
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
    const [activeProfile, setActiveProfile] = useState<BusinessProfile | null>(null);
    const [activeVariant, setActiveVariant] = useState<'vibrant' | 'clean' | 'dark'>('vibrant');
    const [isLoading, setIsLoading] = useState(true);
    const { setThemeTokens, setSidebarTheme, setPrimaryColor, setFontFamily } = useUISettings();

    useEffect(() => {
        // Load persisted profile and variant
        const savedProfileId = localStorage.getItem('active_business_profile');
        const savedVariant = localStorage.getItem('active_business_variant') as any;

        if (savedProfileId) {
            const profile = businessProfiles.find(p => p.id === savedProfileId);
            if (profile) {
                const variant = savedVariant || 'vibrant';
                setActiveProfile(profile);
                setActiveVariant(variant);
                applyProfileTheme(profile, variant);
            }
        }
        setIsLoading(false);
    }, []);

    const applyProfileTheme = (profile: BusinessProfile, variant: 'vibrant' | 'clean' | 'dark') => {
        const theme = profile.theme.variants[variant];

        // Apply visual tokens instantly
        setPrimaryColor(theme.primary);
        setFontFamily(profile.theme.font);

        setThemeTokens({
            secondaryColor: theme.secondary,
            accentColor: theme.accent,
            cardBackground: theme.cardBackground,
            textColor: theme.textColor,
            borderRadius: profile.theme.radius,
            // Map profile background abstract concept to UI settings background
            pageBackground: theme.background as any
        });
    };

    const setProfile = (profileId: string, variant: 'vibrant' | 'clean' | 'dark' = 'vibrant') => {
        const profile = businessProfiles.find(p => p.id === profileId);
        if (profile) {
            setActiveProfile(profile);
            setActiveVariant(variant);
            localStorage.setItem('active_business_profile', profile.id);
            localStorage.setItem('active_business_variant', variant);
            applyProfileTheme(profile, variant);
        }
    };

    const setVariant = (variant: 'vibrant' | 'clean' | 'dark') => {
        if (activeProfile) {
            setActiveVariant(variant);
            localStorage.setItem('active_business_variant', variant);
            applyProfileTheme(activeProfile, variant);
        }
    };

    const resetProfile = () => {
        setActiveProfile(null);
        localStorage.removeItem('active_business_profile');
        localStorage.removeItem('active_business_variant');
    };

    return (
        <BusinessProfileContext.Provider value={{
            activeProfile,
            activeVariant,
            setProfile,
            setVariant,
            resetProfile,
            isLoading,
            profiles: businessProfiles
        }}>
            {children}
        </BusinessProfileContext.Provider>
    );
}

export function useBusinessProfile() {
    const context = useContext(BusinessProfileContext);
    if (context === undefined) {
        throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
    }
    return context;
}
