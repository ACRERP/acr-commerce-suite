import { 
    Palette, Smartphone, Shirt, Briefcase, Home, ChefHat, 
    Utensils, Pill, Dog, Scissors, Stethoscope, Hammer, GraduationCap, 
    Disc, Car, UserCog
} from 'lucide-react';

export type BusinessProfile = {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    imageUrl: string;
    systemCategory: 'food' | 'retail' | 'service' | 'health' | 'corporate';
    features: string[];
    modules: string[];
    theme: {
        primary: string;
        secondary: string;
        accent: string;
        mode: 'light' | 'dark';
        variants: {
            vibrant: { primary: string; secondary: string; };
            clean: { primary: string; secondary: string; };
            dark: { primary: string; secondary: string; };
        }
    };
};

export const businessProfiles: BusinessProfile[] = [
    {
        id: 'makeup_store',
        label: 'Loja de Maquiagem / Beleza',
        description: 'Gestão para boutiques de cosméticos com controle de tons e catálogo visual.',
        icon: Palette,
        color: '#ec4899',
        imageUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1200',
        systemCategory: 'retail',
        features: ['visual_catalog', 'color_variation', 'stock_alerts'],
        modules: ['pdv', 'inventory', 'clients', 'finance', 'marketing'],
        theme: {
            primary: '#ec4899',
            secondary: '#fbcfe8',
            accent: '#be185d',
            mode: 'light',
            variants: {
                vibrant: { primary: '#db2777', secondary: '#fce7f3' },
                clean: { primary: '#fce7f3', secondary: '#831843' },
                dark: { primary: '#1f2937', secondary: '#db2777' }
            }
        }
    },
    {
        id: 'mechanic',
        label: 'Mecânica / Auto Center',
        description: 'Controle de ordens de serviço, peças e histórico veicular.',
        icon: Car,
        color: '#ef4444',
        imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200',
        systemCategory: 'service',
        features: ['automotive_os', 'vehicle_history', 'parts_control', 'scheduling'],
        modules: ['service_orders', 'inventory', 'clients', 'finance', 'scheduling'],
        theme: {
            primary: '#ef4444',
            secondary: '#fee2e2',
            accent: '#b91c1c',
            mode: 'dark',
            variants: {
                vibrant: { primary: '#dc2626', secondary: '#450a0a' },
                clean: { primary: '#1f2937', secondary: '#991b1b' },
                dark: { primary: '#0a0a0a', secondary: '#dc2626' }
            }
        }
    },
    {
        id: 'electronics',
        label: 'Eletrônicos / Reparos',
        description: 'Gestão de assistência técnica com rastreio por IMEI e checklist.',
        icon: Smartphone,
        color: '#3b82f6',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1200',
        systemCategory: 'service',
        features: ['electronics_os', 'imei_tracking', 'diagnostic_checklist', 'warranties'],
        modules: ['service_orders', 'inventory', 'clients', 'finance'],
        theme: {
            primary: '#3b82f6',
            secondary: '#dbeafe',
            accent: '#1d4ed8',
            mode: 'dark',
            variants: {
                vibrant: { primary: '#2563eb', secondary: '#1e3a8a' },
                clean: { primary: '#1e293b', secondary: '#1d4ed8' },
                dark: { primary: '#0f172a', secondary: '#3b82f6' }
            }
        }
    },
    {
        id: 'clothing_store',
        label: 'Loja de Roupas',
        description: 'Controle de grade de cores e tamanhos com PDV ágil.',
        icon: Shirt,
        color: '#8b5cf6',
        imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200',
        systemCategory: 'retail',
        features: ['variants_grid', 'collections', 'promotions', 'crm'],
        modules: ['pdv', 'inventory', 'clients', 'crm', 'finance'],
        theme: {
            primary: '#8b5cf6',
            secondary: '#ede9fe',
            accent: '#6d28d9',
            mode: 'light',
            variants: {
                vibrant: { primary: '#7c3aed', secondary: '#ddd6fe' },
                clean: { primary: '#f5f3ff', secondary: '#5b21b6' },
                dark: { primary: '#1e1b4b', secondary: '#7c3aed' }
            }
        }
    },
    {
        id: 'tire_shop',
        label: 'Borracharia',
        description: 'Serviços rápidos de pneus e alinhamento com controle de estoque.',
        icon: Disc,
        color: '#f97316',
        imageUrl: 'https://images.unsplash.com/photo-1605218427360-bc327b5e8dd4?q=80&w=1200',
        systemCategory: 'service',
        features: ['automotive_os', 'quick_service', 'tire_stock', 'scheduling'],
        modules: ['service_orders', 'inventory', 'clients', 'finance', 'scheduling'],
        theme: {
            primary: '#f97316',
            secondary: '#ffedd5',
            accent: '#c2410c',
            mode: 'dark',
            variants: {
                vibrant: { primary: '#ea580c', secondary: '#7c2d12' },
                clean: { primary: '#292524', secondary: '#ea580c' },
                dark: { primary: '#1c1917', secondary: '#f97316' }
            }
        }
    },
    {
        id: 'business_generic',
        label: 'Negócios / Empresas',
        description: 'Gestão corporativa, CRM e financeiro para prestadores de serviço.',
        icon: Briefcase,
        color: '#64748b',
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200',
        systemCategory: 'corporate',
        features: ['crm', 'kanban_crm', 'reports_advanced', 'project_management'],
        modules: ['clients', 'crm', 'finance', 'reports'],
        theme: {
            primary: '#64748b',
            secondary: '#f1f5f9',
            accent: '#334155',
            mode: 'light',
            variants: {
                vibrant: { primary: '#475569', secondary: '#e2e8f0' },
                clean: { primary: '#f8fafc', secondary: '#475569' },
                dark: { primary: '#0f172a', secondary: '#94a3b8' }
            }
        }
    },
    {
        id: 'real_estate',
        label: 'Imobiliária / Móveis',
        description: 'Galeria de imóveis e projetos com gestão de propostas.',
        icon: Home,
        color: '#059669',
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200',
        systemCategory: 'corporate',
        features: ['crm', 'kanban_crm', 'property_gallery', 'proposals', 'client_matching'],
        modules: ['clients', 'crm', 'finance', 'projects'],
        theme: {
            primary: '#059669',
            secondary: '#d1fae5',
            accent: '#047857',
            mode: 'light',
            variants: {
                vibrant: { primary: '#059669', secondary: '#d1fae5' },
                clean: { primary: '#ecfdf5', secondary: '#064e3b' },
                dark: { primary: '#022c22', secondary: '#10b981' }
            }
        }
    },
    {
        id: 'bakery',
        label: 'Padaria / Confeitaria',
        description: 'Gestão de produção diária e PDV rápido para horários de pico.',
        icon: ChefHat,
        color: '#d97706',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1200',
        systemCategory: 'food',
        features: ['daily_production', 'quick_pdv', 'recipes'],
        modules: ['pdv', 'inventory', 'finance', 'production'],
        theme: {
            primary: '#d97706',
            secondary: '#fef3c7',
            accent: '#b45309',
            mode: 'light',
            variants: {
                vibrant: { primary: '#d97706', secondary: '#78350f' },
                clean: { primary: '#fffbeb', secondary: '#92400e' },
                dark: { primary: '#1c1917', secondary: '#d97706' }
            }
        }
    },
    {
        id: 'restaurant',
        label: 'Restaurante / Delivery',
        description: 'Controle de mesas, cardápio digital e integração com delivery.',
        icon: Utensils,
        color: '#be123c',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200',
        systemCategory: 'food',
        features: ['digital_menu', 'table_management', 'delivery_integration'],
        modules: ['pdv', 'delivery', 'kitchen', 'finance'],
        theme: {
            primary: '#be123c',
            secondary: '#ffe4e6',
            accent: '#9f1239',
            mode: 'dark',
            variants: {
                vibrant: { primary: '#e11d48', secondary: '#881337' },
                clean: { primary: '#4c0519', secondary: '#e11d48' },
                dark: { primary: '#1a1a1a', secondary: '#e11d48' }
            }
        }
    },
    {
        id: 'pharmacy',
        label: 'Farmácia / Drogaria',
        description: 'Controle rigoroso de lotes, validade e receituários.',
        icon: Pill,
        color: '#0891b2',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1200',
        systemCategory: 'health',
        features: ['batch_control', 'expiration_alerts', 'sngpc'],
        modules: ['pdv', 'inventory', 'clients', 'finance', 'compliance'],
        theme: {
            primary: '#0891b2',
            secondary: '#cffafe',
            accent: '#0e7490',
            mode: 'light',
            variants: {
                vibrant: { primary: '#06b6d4', secondary: '#ecfeff' },
                clean: { primary: '#ecfeff', secondary: '#155e75' },
                dark: { primary: '#083344', secondary: '#0891b2' }
            }
        }
    },
    {
        id: 'pet_shop',
        label: 'Pet Shop / Veterinária',
        description: 'Histórico de vacinas, agendamento de banho/tosa e clínica.',
        icon: Dog,
        color: '#f59e0b',
        imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1200',
        systemCategory: 'health',
        features: ['pet_profile', 'vaccine_schedule', 'grooming_schedule', 'clinical_history'],
        modules: ['clients', 'service_orders', 'inventory', 'finance', 'scheduling'],
        theme: {
            primary: '#f59e0b',
            secondary: '#fef3c7',
            accent: '#d97706',
            mode: 'light',
            variants: {
                vibrant: { primary: '#f59e0b', secondary: '#fffbeb' },
                clean: { primary: '#fffbeb', secondary: '#b45309' },
                dark: { primary: '#451a03', secondary: '#f59e0b' }
            }
        }
    },
    {
        id: 'beauty_salon',
        label: 'Salão de Beleza / Barbearia',
        description: 'Agendamento eficiente e cálculo de comissões por profissional.',
        icon: Scissors,
        color: '#db2777',
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
        systemCategory: 'service',
        features: ['commission_calc', 'smart_schedule', 'loyalty_program'],
        modules: ['clients', 'finance', 'team', 'scheduling'],
        theme: {
            primary: '#db2777',
            secondary: '#fce7f3',
            accent: '#be185d',
            mode: 'light',
            variants: {
                vibrant: { primary: '#db2777', secondary: '#fce7f3' },
                clean: { primary: '#fdf2f8', secondary: '#9d174d' },
                dark: { primary: '#500724', secondary: '#db2777' }
            }
        }
    },
    {
        id: 'medical_clinic',
        label: 'Clínica / Consultório',
        description: 'Prontuário eletrônico seguro e agenda de consultas.',
        icon: Stethoscope,
        color: '#0d9488',
        imageUrl: 'https://images.unsplash.com/photo-1631217868269-df49c5f418d1?q=80&w=1200',
        systemCategory: 'health',
        features: ['electronic_records', 'telemedicine', 'insurance_billing', 'medical_schedule'],
        modules: ['clients', 'finance', 'scheduling'],
        theme: {
            primary: '#0d9488',
            secondary: '#ccfbf1',
            accent: '#0f766e',
            mode: 'light',
            variants: {
                vibrant: { primary: '#14b8a6', secondary: '#f0fdfa' },
                clean: { primary: '#f0fdfa', secondary: '#115e59' },
                dark: { primary: '#042f2e', secondary: '#0d9488' }
            }
        }
    },
    {
        id: 'construction',
        label: 'Material de Construção',
        description: 'Venda por volume, estoque pesado e entregas.',
        icon: Hammer,
        color: '#ea580c',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200',
        systemCategory: 'retail',
        features: ['volume_sales', 'delivery_logistics', 'heavy_stock', 'quotes'],
        modules: ['pdv', 'inventory', 'clients', 'finance', 'delivery'],
        theme: {
            primary: '#ea580c',
            secondary: '#ffedd5',
            accent: '#c2410c',
            mode: 'light',
            variants: {
                vibrant: { primary: '#f97316', secondary: '#fff7ed' },
                clean: { primary: '#f97316', secondary: '#7c2d12' },
                dark: { primary: '#431407', secondary: '#ea580c' }
            }
        }
    },
    {
        id: 'education',
        label: 'Escola / Cursos',
        description: 'Gestão de matrículas, financeiro recorrente e aulas.',
        icon: GraduationCap,
        color: '#4f46e5',
        imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200',
        systemCategory: 'corporate',
        features: ['enrollment', 'recurring_billing', 'class_schedule'],
        modules: ['clients', 'finance', 'academic'],
        theme: {
            primary: '#4f46e5',
            secondary: '#e0e7ff',
            accent: '#4338ca',
            mode: 'light',
            variants: {
                vibrant: { primary: '#6366f1', secondary: '#eef2ff' },
                clean: { primary: '#eef2ff', secondary: '#3730a3' },
                dark: { primary: '#1e1b4b', secondary: '#4f46e5' }
            }
        }
    },
    {
        id: 'service_provider',
        label: 'Prestador de Serviço',
        description: 'Ordens de serviço, agenda e controle de clientes para autônomos.',
        icon: UserCog,
        color: '#6366f1',
        imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=1200',
        systemCategory: 'service',
        features: ['generic_os', 'service_orders', 'mobile_tools'],
        modules: ['service_orders', 'clients', 'finance'],
        theme: {
            primary: '#6366f1',
            secondary: '#e0e7ff',
            accent: '#4f46e5',
            mode: 'light',
            variants: {
                vibrant: { primary: '#6366f1', secondary: '#e0e7ff' },
                clean: { primary: '#eef2ff', secondary: '#312e81' },
                dark: { primary: '#1e1b4b', secondary: '#6366f1' }
            }
        }
    }
];
