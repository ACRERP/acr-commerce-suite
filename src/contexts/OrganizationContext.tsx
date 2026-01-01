import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface Organization {
    id: string;
    name: string;
    slug: string;
    role?: string; // Role of current user in this org
    permissions?: Record<string, any>;
}

interface OrganizationContextType {
    currentOrganization: Organization | null;
    organizations: Organization[];
    isLoading: boolean;
    switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setOrganizations([]);
            setCurrentOrganization(null);
            setIsLoading(false);
            return;
        }

        const fetchOrganizations = async () => {
            setIsLoading(true);
            try {
                // Fetch orgs via the member table (which defines access)
                const { data, error } = await supabase
                    .from('organization_members')
                    .select(`
                        organization:organizations (id, name, slug),
                        role,
                        role_details:organization_roles ( name, permissions )
                    `);

                if (error) {
                    console.error('Error fetching organizations:', error);
                    return;
                }

                const orgs = data?.map(d => {
                    const roleDetails = Array.isArray(d.role_details) ? d.role_details[0] : d.role_details;
                    return {
                        ...d.organization,
                        role: d.role,
                        permissions: roleDetails?.permissions || {} // Admin/Owner logic handled elsewhere
                    };
                }) as Organization[] || [];

                setOrganizations(orgs);

                // Default to first org found if none selected
                if (orgs.length > 0 && !currentOrganization) {
                    // Try to recover from local storage
                    const savedOrgId = localStorage.getItem('acr_current_org_id');
                    const savedOrg = orgs.find(o => o.id === savedOrgId);
                    setCurrentOrganization(savedOrg || orgs[0]);
                }
            } catch (err) {
                console.error('Failed to init organizations:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrganizations();
    }, [user]);

    const switchOrganization = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            setCurrentOrganization(org);
            localStorage.setItem('acr_current_org_id', org.id);
            // Optionally force a reload or invalidate all queries
            window.location.reload();
        }
    };

    return (
        <OrganizationContext.Provider value={{ currentOrganization, organizations, isLoading, switchOrganization }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}
