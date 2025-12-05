import React from 'react';
import { ReceiptData, ReceiptOptions } from '@/lib/receipt';

// Receipt preview hook
export function useReceiptPreview() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null);
  const [options, setOptions] = React.useState<Partial<ReceiptOptions>>({});

  const openPreview = (data: ReceiptData, opts: Partial<ReceiptOptions> = {}) => {
    setReceiptData(data);
    setOptions(opts);
    setIsOpen(true);
  };

  const closePreview = () => {
    setIsOpen(false);
    setReceiptData(null);
  };

  return {
    isOpen,
    receiptData,
    options,
    openPreview,
    closePreview,
  };
}

// Receipt settings hook
export function useReceiptSettings() {
  const [settings, setSettings] = React.useState({
    companyInfo: {
      name: 'ACR Commerce Suite',
      document: 'CNPJ: 00.000.000/0001-00',
      address: 'Rua Principal, 123 - Centro',
      phone: '(11) 1234-5678',
      email: 'contato@acrcommerce.com.br',
    },
    defaultOptions: {
      printHeader: true,
      printFooter: true,
      printClientInfo: true,
      printPaymentDetails: true,
      printDiscounts: true,
      printBarcode: false,
      printQrCode: false,
      fontSize: 'medium' as const,
      paperWidth: 80,
    },
  });

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to load receipt settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: typeof settings) => {
    localStorage.setItem('receiptSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings({
      companyInfo: {
        name: 'ACR Commerce Suite',
        document: 'CNPJ: 00.000.000/0001-00',
        address: 'Rua Principal, 123 - Centro',
        phone: '(11) 1234-5678',
        email: 'contato@acrcommerce.com.br',
      },
      defaultOptions: {
        printHeader: true,
        printFooter: true,
        printClientInfo: true,
        printPaymentDetails: true,
        printDiscounts: true,
        printBarcode: false,
        printQrCode: false,
        fontSize: 'medium',
        paperWidth: 80,
      },
    });
    localStorage.removeItem('receiptSettings');
  };

  React.useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loadSettings,
    saveSettings,
    resetSettings,
  };
}
