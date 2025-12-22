import React from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * FeatureGuard: Oculta elementos da interface se a funcionalidade 
 * não estiver presente no perfil ativo.
 */
export const FeatureGuard = ({
    feature,
    children,
    fallback = null
}: {
    feature: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) => {
    const { activeProfile } = useBusinessProfile();

    if (!activeProfile) return null;

    const features = Array.isArray(feature) ? feature : [feature];
    const hasFeature = features.some(f => activeProfile.features.includes(f));

    return hasFeature ? <>{children}</> : <>{fallback}</>;
};

/**
 * ModuleGuard: Protege rotas inteiras. Redireciona para o dashboard
 * se o módulo não estiver disponível no perfil.
 */
export const ModuleGuard = ({
    module,
    children
}: {
    module: string;
    children: React.ReactNode;
}) => {
    const { activeProfile, isLoading } = useBusinessProfile();
    const location = useLocation();

    if (isLoading) return null;

    // Se não houver perfil ativo (ex: onboarding), permite a passagem ou trata via ProtectedRoute
    if (!activeProfile) return <>{children}</>;

    const hasModule = activeProfile.modules.includes(module);

    if (!hasModule) {
        console.warn(`[ModuleGuard] Acesso negado ao módulo "${module}" para o perfil "${activeProfile.id}". Redirecionando...`);
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
