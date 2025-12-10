/**
 * Hook para gerenciar atalhos de teclado globais
 * 
 * Atalhos disponíveis:
 * - F2: Buscar produto
 * - F3: Buscar cliente
 * - F5: Aplicar desconto
 * - F12: Finalizar venda
 * - Ctrl+N: Nova venda
 * - ESC: Cancelar/Fechar dialog
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onSearchProduct?: () => void;
  onSearchClient?: () => void;
  onApplyDiscount?: () => void;
  onFinalizeSale?: () => void;
  onNewSale?: () => void;
  onCancel?: () => void;
}

export function useGlobalShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Não processar se estiver digitando em um input/textarea
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // F2 - Buscar Produto
      if (event.key === 'F2' && handlers.onSearchProduct) {
        event.preventDefault();
        handlers.onSearchProduct();
        return;
      }

      // F3 - Buscar Cliente
      if (event.key === 'F3' && handlers.onSearchClient) {
        event.preventDefault();
        handlers.onSearchClient();
        return;
      }

      // F5 - Aplicar Desconto (apenas se não estiver em input)
      if (event.key === 'F5' && handlers.onApplyDiscount && !isInputField) {
        event.preventDefault();
        handlers.onApplyDiscount();
        return;
      }

      // F12 - Finalizar Venda
      if (event.key === 'F12' && handlers.onFinalizeSale) {
        event.preventDefault();
        handlers.onFinalizeSale();
        return;
      }

      // Ctrl+N - Nova Venda
      if (event.ctrlKey && event.key === 'n' && handlers.onNewSale) {
        event.preventDefault();
        handlers.onNewSale();
        return;
      }

      // ESC - Cancelar/Fechar
      if (event.key === 'Escape' && handlers.onCancel) {
        handlers.onCancel();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook simplificado para atalhos de dialogs
 */
export function useDialogShortcuts(onClose: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, enabled]);
}
