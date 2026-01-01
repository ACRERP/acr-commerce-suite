import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BusinessProfile, businessProfiles } from '@/config/business-profiles';
import { useUISettings } from './UISettingsContext';
import { supabase } from '@/lib/supabaseClient'; // Ensure supabase client is available
import { useAuth } from './AuthContext';

interface BusinessProfileContextType {
    activeProfile: BusinessProfile | null;
    activeVariant: 'vibrant' | 'clean' | 'dark';
    setProfile: (profileId: string, variant?: 'vibrant' | 'clean' | 'dark') => void;
    setVariant: (variant: 'vibrant' | 'clean' | 'dark') => void;
    resetProfile: () => void;
    isLoading: boolean;
    profiles: BusinessProfile[];
    isLocked: boolean; // New: If true, user cannot switch profiles
    extraModules: string[]; // New: List of extra modules purchased
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
    const [activeProfile, setActiveProfile] = useState<BusinessProfile | null>(null);
    const [activeVariant, setActiveVariant] = useState<'vibrant' | 'clean' | 'dark'>('vibrant');
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [extraModules, setExtraModules] = useState<string[]>([]);

    const { setThemeTokens, setSidebarTheme, setPrimaryColor, setFontFamily } = useUISettings();
    const { user } = useAuth(); // Monitor auth state to fetch constraints

    // 1. Load initial state from LocalStorage AND Supabase
    useEffect(() => {
        const initializeProfile = async () => {
            // Default from LocalStorage
            const savedProfileId = localStorage.getItem('active_business_profile');
            const savedVariant = localStorage.getItem('active_business_variant') as any;

            if (savedProfileId) {
                const profile = businessProfiles.find(p => p.id === savedProfileId);
                if (profile) {
                    setActiveProfile(profile);
                    setActiveVariant(savedVariant || 'vibrant');
                    applyProfileTheme(profile, savedVariant || 'vibrant');
                }
            }

            // If user is logged in, check for locks in DB
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('locked_profile_id, extra_modules, plan_tier')
                        .eq('id', user.id)
                        .single();

                    if (data && !error) {
                        // Set extra modules
                        setExtraModules(data.extra_modules || []);

                        // enforce lock if present
                        if (data.locked_profile_id) {
                            setIsLocked(true);
                            const lockedProfile = businessProfiles.find(p => p.id === data.locked_profile_id);
                            if (lockedProfile && lockedProfile.id !== savedProfileId) {
                                // Force switch to locked profile
                                setActiveProfile(lockedProfile);
                                applyProfileTheme(lockedProfile, 'vibrant'); // Enforce default variant for simplicity or load pref
                                localStorage.setItem('active_business_profile', lockedProfile.id);
                            }
                        } else {
                            setIsLocked(false);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching profile constraints:", err);
                }
            }

            setIsLoading(false);
        };

        initializeProfile();
    }, [user, user?.id]); // Re-run when user changes

    const applyProfileTheme = (profile: BusinessProfile, variant: 'vibrant' | 'clean' | 'dark') => {
        const variantTheme = profile.theme.variants[variant];

        // Apply visual tokens instantly
        setPrimaryColor(variantTheme.primary);
        // Default font since it's not in the type yet
        setFontFamily('inter');

        setThemeTokens({
            secondaryColor: variantTheme.secondary,
            // Fallback to profile accent if not in variant (it's not in the type)
            accentColor: profile.theme.accent,
            // Default values for properties not yet in BusinessProfile type
            cardBackground: profile.theme.mode === 'dark' ? '#1e293b' : '#ffffff',
            textColor: profile.theme.mode === 'dark' ? '#f8fafc' : '#0f172a',
            borderRadius: 'md',
            pageBackground: 'standard'
        });

        // Apply Dark Mode Class
        const root = window.document.documentElement;
        if (profile.theme.mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    const setProfile = async (profileId: string, variant: 'vibrant' | 'clean' | 'dark' = 'vibrant') => {
        // PERMISSION CHECK
        if (isLocked) {
            console.warn("Operation Blocked: Profile is locked by plan tier.");
            return; // Silent fail or trigger toast (need toast context)
        }

        const profile = businessProfiles.find(p => p.id === profileId);
        if (profile) {
            setActiveProfile(profile);
            setActiveVariant(variant);
            localStorage.setItem('active_business_profile', profile.id);
            localStorage.setItem('active_business_variant', variant);
            applyProfileTheme(profile, variant);

            // If user is logged in, optionally save this preference to DB if NOT locked
            if (user) {
                // Future: await supabase.from('profiles').update({ ... })...
            }
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
        if (isLocked) return;
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
            profiles: businessProfiles,
            isLocked,
            extraModules
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
