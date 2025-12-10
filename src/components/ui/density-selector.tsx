import { Minimize2, Square, Maximize2 } from 'lucide-react';
import { useUISettings, DensityMode } from '@/contexts/UISettingsContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function DensitySelector() {
    const { densityMode, setDensityMode } = useUISettings();

    const densityOptions: Array<{ value: DensityMode; label: string; icon: typeof Minimize2 }> = [
        { value: 'compact', label: 'Compacto', icon: Minimize2 },
        { value: 'comfortable', label: 'Confortável', icon: Square },
        { value: 'spacious', label: 'Espaçoso', icon: Maximize2 },
    ];

    return (
        <Select value={densityMode} onValueChange={setDensityMode}>
            <SelectTrigger className="w-[180px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {densityOptions.map(option => {
                    const Icon = option.icon;
                    return (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span>{option.label}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
