import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LicenseService } from '@/lib/licensing/license-service';

export function useLicenseLimits() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const checkLimit = async (resource: 'products' | 'sales') => {
        if (!user) return { canCreate: false, current: 0, max: 0 };
        return await LicenseService.checkResourceLimit(resource, user.id);
    };

    return { checkLimit, loading };
}
