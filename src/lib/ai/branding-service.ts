
/**
 * Branding Service
 * Hand-crafted logic to simulate AI brand architect behavior.
 * Maps color palettes and business categories to design traits.
 */

export type BrandArchetype = 'elite' | 'creative' | 'modern' | 'friendly' | 'minimal';

export interface BrandTraits {
    archetype: BrandArchetype;
    feeling: string;
    suggestedFonts: string[];
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadows: 'none' | 'soft' | 'heavy';
    borderStyle: 'none' | 'soft' | 'marked';
}

export const getBrandTraits = (palette: string[], category: string): BrandTraits => {
    const primary = palette[0] || '#000000';
    
    // Simple logic based on color temperature and category
    const isWarm = isWarmColor(primary);
    
    if (category === 'health' || category === 'corporate') {
        return {
            archetype: 'elite',
            feeling: 'Confiança, Autoridade e Precisão',
            suggestedFonts: ['inter', 'montserrat'],
            radius: 'sm',
            shadows: 'soft',
            borderStyle: 'marked'
        };
    }

    if (category === 'food' || isWarm) {
        return {
            archetype: 'friendly',
            feeling: 'Acolhimento, Energia e Proximidade',
            suggestedFonts: ['outfit', 'lexend'],
            radius: 'lg',
            shadows: 'soft',
            borderStyle: 'soft'
        };
    }

    if (category === 'retail' || palette.length > 5) {
        return {
            archetype: 'creative',
            feeling: 'Inovação, Dinamismo e Estilo',
            suggestedFonts: ['poppins', 'outfit'],
            radius: 'md',
            shadows: 'heavy',
            borderStyle: 'none'
        };
    }

    return {
        archetype: 'modern',
        feeling: 'Eficiência, Tecnologia e Clareza',
        suggestedFonts: ['inter', 'mono'],
        radius: 'md',
        shadows: 'soft',
        borderStyle: 'soft'
    };
};

// Helper: Check if a hex color is "warm"
function isWarmColor(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r > b && r > g; // Generally red/orange dominant
}
