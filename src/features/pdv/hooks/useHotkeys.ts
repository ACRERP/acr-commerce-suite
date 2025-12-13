import { useHotkeys } from 'react-hotkeys-hook';

interface PDVHotkeysProps {
    onSearchFocus: () => void;
    onPayment: () => void;
    onDiscount: () => void;
    onDelivery: () => void;
    onClient: () => void;
    onCancel: () => void;
}

export function usePDVHotkeys({
    onSearchFocus,
    onPayment,
    onDiscount,
    onDelivery,
    onClient,
    onCancel
}: PDVHotkeysProps) {
    useHotkeys('f2', (e) => { e.preventDefault(); onSearchFocus(); }, { enableOnFormTags: true });
    useHotkeys('f4', (e) => { e.preventDefault(); onDiscount(); }, { enableOnFormTags: true });
    useHotkeys('f5', (e) => { e.preventDefault(); onPayment(); }, { enableOnFormTags: true });
    useHotkeys('f6', (e) => { e.preventDefault(); onDelivery(); }, { enableOnFormTags: true });
    useHotkeys('f7', (e) => { e.preventDefault(); onClient(); }, { enableOnFormTags: true });
    useHotkeys('escape', (e) => { e.preventDefault(); onCancel(); }, { enableOnFormTags: true });
}
