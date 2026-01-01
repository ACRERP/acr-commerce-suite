import { useHotkeys } from 'react-hotkeys-hook';

interface PDVHotkeysProps {
    onSearchFocus: () => void;
    onPayment: () => void;
    onDiscount: () => void;
    onDelivery: () => void;
    onClient: () => void;
    onSeller: () => void;
    onCashOps: () => void;
    onCloseCash: () => void;
    onRecentSales: () => void;
    onCancel: () => void;
}

export function usePDVHotkeys({
    onSearchFocus,
    onPayment,
    onDiscount,
    onDelivery,
    onClient,
    onSeller,
    onCashOps,
    onCloseCash,
    onRecentSales,
    onCancel
}: PDVHotkeysProps) {
    useHotkeys('f1', (e) => { e.preventDefault(); alert("F1: Ajuda (Em breve)"); }, { enableOnFormTags: true });
    useHotkeys('f2', (e) => { e.preventDefault(); onSearchFocus(); }, { enableOnFormTags: true });
    useHotkeys('f9', (e) => { e.preventDefault(); onSeller(); }, { enableOnFormTags: true });
    useHotkeys('f3', (e) => { e.preventDefault(); onSeller(); }, { enableOnFormTags: true }); // Keep F3 for compatibility if they got used to it
    useHotkeys('f4', (e) => { e.preventDefault(); onDiscount(); }, { enableOnFormTags: true });
    useHotkeys('f5', (e) => { e.preventDefault(); onPayment(); }, { enableOnFormTags: true });
    useHotkeys('f6', (e) => { e.preventDefault(); onDelivery(); }, { enableOnFormTags: true });
    useHotkeys('f7', (e) => { e.preventDefault(); onClient(); }, { enableOnFormTags: true });
    useHotkeys('f8', (e) => { e.preventDefault(); onRecentSales(); }, { enableOnFormTags: true });
    useHotkeys('f10', (e) => { e.preventDefault(); onCashOps(); }, { enableOnFormTags: true });
    useHotkeys('f11', (e) => { e.preventDefault(); onCloseCash(); }, { enableOnFormTags: true });
    useHotkeys('escape', (e) => { e.preventDefault(); onCancel(); }, { enableOnFormTags: true });
}
