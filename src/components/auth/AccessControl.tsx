import React from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

interface GuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface FeatureGuardProps extends GuardProps {
    feature: string;
}

interface ModuleGuardProps extends GuardProps {
    module: string;
}

/**
 * Component to wrap features that depend on specific business profile capabilities.
 */
export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
    const { activeProfile } = useBusinessProfile();

    if (!activeProfile) return <>{fallback}</>;

    const hasFeature = activeProfile.features.includes(feature);

    if (!hasFeature) return <>{fallback}</>;

    return <>{children}</>;
}

/**
 * Component to wrap entire modules or navigation links.
 */
export function ModuleGuard({ module, children, fallback = null }: ModuleGuardProps) {
    const { activeProfile } = useBusinessProfile();

    if (!activeProfile) return <>{fallback}</>;

    const hasModule = activeProfile.modules.includes(module);

    if (!hasModule) return <>{fallback}</>;

    return <>{children}</>;
}

/**
 * Helper hook for programmatic access control
 */
export function useAccessControl() {
    const { activeProfile } = useBusinessProfile();

    const hasFeature = (feature: string) => {
        return activeProfile?.features.includes(feature) || false;
    };

    const hasModule = (module: string) => {
        return activeProfile?.modules.includes(module) || false;
    };

    return { hasFeature, hasModule, profile: activeProfile };
}
